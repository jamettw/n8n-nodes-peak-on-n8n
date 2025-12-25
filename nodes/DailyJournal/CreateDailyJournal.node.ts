import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { formatTimestamp, hmacSha1Hex } from '../../helpers/time';

type Credentials = {
	userToken: string;
	clientToken: string;
	connectId: string;
};

export class CreateDailyJournal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PEAK Create Daily Journal',
		name: 'createDailyJournal',
		icon: 'file:../../assets/PEAK.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send JSON payload to create daily journal via PEAK API',
		defaults: {
			name: 'Create DailyJournal',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'PEAKApi', required: true }],
		usableAsTool: true,
		properties: [
			{
                displayName: 'Server Environment',
                name: 'serverEnvironment',
                type: 'options',
                typeOptions: { rows: 1 },
                default: 'production',
                required: true,
                description: 'Product ID to retrieve',
                options: [
                    {
                        name: 'UAT',
                        value: 'uat',
                    },
                    {
                        name: 'Production',
                        value: 'production',
                    },
                ],
            },
			// JSON body input
			{
				displayName: 'JSON Body',
				name: 'jsonBody',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '{\n  "merchantId": "241027",\n  "issueDate": "2025-10-16",\n  "items": []\n}',
				required: true,
				description: 'Raw JSON payload (you can map from previous node with {{$json}})',
			},

			// Token override option
			{
				displayName: 'Client Token (override)',
				name: 'clientTokenOverride',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Optional override (useful when token refreshes every 24h)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const creds = (await this.getCredentials('PEAKApi')) as Credentials;

		const userToken = creds.userToken;
		const connectId = creds.connectId;

		let endpointUrl = 'https://peakengineapidev.azurewebsites.net/api/v1/dailyJournals';

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
                const serverEnv = this.getNodeParameter('serverEnvironment', itemIndex, '') as string;
				const jsonBodyStr = this.getNodeParameter('jsonBody', itemIndex) as string;
				const clientTokenOverride = this.getNodeParameter('clientTokenOverride', itemIndex, '') as string;

				if (serverEnv === 'production') {
                    endpointUrl = endpointUrl.replace('peakengineapidev.azurewebsites.net', 'api.peakaccount.com');
                }

				const clientToken = clientTokenOverride || creds.clientToken;
				if (!clientToken) throw new Error('Client Token is required (credentials or override).');

				let bodyObj: Record<string, unknown>;
				try {
					bodyObj = JSON.parse(jsonBodyStr);
					if (typeof bodyObj !== 'object' || bodyObj === null) {
						throw new Error('JSON Body must be an object.');
					}
				} catch {
					throw new Error('Invalid JSON Body.');
				}

				const timeStamp = formatTimestamp(new Date(), false); // UTC fixed
				const timeSignature = hmacSha1Hex(connectId, timeStamp);

				const headers = {
					'User-Token': userToken,
					'Client-Token': clientToken,
					'Time-Stamp': timeStamp,
					'Time-Signature': timeSignature,
					'Content-Type': 'application/json',
				};

				const options: IHttpRequestOptions = {
					method: 'POST',
					url: endpointUrl,
					headers,
					body: bodyObj,
					json: true as const,
				};

				const response = await this.helpers.httpRequest!(options);
				returnData.push({
					json: {
						success: true,
						statusCode: 200,
						data: response,
						headers,
					},
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}

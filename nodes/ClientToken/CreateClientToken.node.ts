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

export class CreateClientToken implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'PEAK Create Client Token',
        name: 'createclienttoken',
        icon: 'file:../../assets/PEAK.svg',
        group: ['output'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Send JSON payload to create client token',
        defaults: {
            name: 'Create Client Token',
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
            {
                displayName: 'Connect Key',
                name: 'connectKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                description: '',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();

        const returnData: INodeExecutionData[] = [];
        const creds = (await this.getCredentials('PEAKApi')) as Credentials;

        const userToken = creds.userToken;
        const connectId = creds.connectId;

        let endpointUrl = 'https://peakengineapidev.azurewebsites.net/api/v1/clienttoken';

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const serverEnv = this.getNodeParameter('serverEnvironment', itemIndex, '') as string;
                const connectKey = this.getNodeParameter('connectKey', itemIndex, '') as string;

                if (serverEnv === 'production') {
                    endpointUrl = endpointUrl.replace('peakengineapidev.azurewebsites.net', 'api.peakaccount.com');
                }

                let bodyObj: Record<string, unknown>;

                if (connectKey === '') {
                    throw new Error('Missing Connect Key.');
                }
                else {
                    var jsonBodyStr = `{"PeakClientToken":{"connectId": "${connectId}","password": "${connectKey}"}}`;
                }

                try {
                    bodyObj = JSON.parse(jsonBodyStr);
                } catch {
                    throw new Error('Invalid JSON Body.');
                }

                const timeStamp = formatTimestamp(new Date(), false); // UTC fixed
                const timeSignature = hmacSha1Hex(connectId, timeStamp);

                const headers = {
                    'User-Token': userToken,
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

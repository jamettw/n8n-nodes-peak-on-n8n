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

export class GetPaymentMethod implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'PEAK Get Payment Method',
        name: 'getPaymentMethod',
        icon: 'file:../../assets/PEAK.svg',
        group: ['input'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Send parameter to get payment method via PEAK API',
        defaults: {
            name: 'Get PaymentMethod',
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
                description: 'PaymentMethod ID to retrieve',
                options: [
                    {
                        name: 'UAT',
                        value: 'uat',
                    },
                    {
                        name: 'PaymentMethodion',
                        value: 'paymentMethodion',
                    },
                ],
            },
            // Parameter input
            {
                displayName: 'PaymentMethod ID',
                name: 'paymentMethodId',
                type: 'string',
                typeOptions: { rows: 1 },
                default: '',
                required: false,
                description: 'PaymentMethod ID to retrieve',
            },

            {
                displayName: 'PaymentMethod Code',
                name: 'paymentMethodCode',
                type: 'string',
                typeOptions: { rows: 1 },
                default: '',
                required: false,
                description: 'PaymentMethod code to retrieve',
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

        let endpointUrl = 'https://peakengineapidev.azurewebsites.net/api/v1/paymentMethods';

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const serverEnv = this.getNodeParameter('serverEnvironment', itemIndex, '') as string;
                const paymentMethodId = this.getNodeParameter('paymentMethodId', itemIndex, '') as string;
                const paymentMethodCode = this.getNodeParameter('paymentMethodCode', itemIndex, '') as string;
                const clientTokenOverride = this.getNodeParameter('clientTokenOverride', itemIndex, '') as string;

                if (serverEnv === 'production') {
                    endpointUrl = endpointUrl.replace('peakengineapidev.azurewebsites.net', 'api.peakaccount.com');
                }

                let endpointWithParams = endpointUrl + '?';

                const clientToken = clientTokenOverride || creds.clientToken;
                if (!clientToken) throw new Error('Client Token is required (credentials or override).');

                if (paymentMethodId !== '') {
                    endpointWithParams += `id=${encodeURIComponent(paymentMethodId)}`;
                }
                if (paymentMethodCode !== '') {
                    endpointWithParams += `code=${encodeURIComponent(paymentMethodCode)}`;
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
                    method: 'GET',
                    url: endpointWithParams,
                    headers,
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

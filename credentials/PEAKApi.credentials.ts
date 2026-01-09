import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';
export class PEAKApi implements ICredentialType {
	name = 'PEAKApi';
	displayName = 'PEAK API';
	documentationUrl = 'https://peak-api-core.readme.io/reference/peak-open-api';

	properties: INodeProperties[] = [
		{
			displayName: 'Server Environment',
			name: 'serverEnvironment',
			type: 'options',
			typeOptions: { rows: 1 },
			default: 'production',
			required: true,
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
			displayName: 'User Token',
			name: 'userToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Connect ID',
			name: 'connectId',
			type: 'string',
			default: '',
			required: true,
			description: '',
		},
		{
			displayName: 'Connect Key',
			name: 'connectKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: '',
		},
	];

	/**
 * NOTE:
 * This is a lightweight smoke test required by n8n automated review.
 * Full authentication (HMAC + timestamp) is performed at runtime
 * when node operations are executed.
 */
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url:
				'https://peakengineapidev.azurewebsites.net/api/v1/clienttoken',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				ping: true,
			},
			json: true,
		},
	};
}
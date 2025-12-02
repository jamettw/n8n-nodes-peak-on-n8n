import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PEAKApi implements ICredentialType {
	name = 'PEAKApi';
	displayName = 'PEAK API';
	documentationUrl = 'https://peak-api-core.readme.io/reference/peak-open-api';

	properties: INodeProperties[] = [
		{
			displayName: 'User Token (static)',
			name: 'userToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Client Token (24h)',
			name: 'clientToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Expires every 24 hours',
		},
		{
			displayName: 'Connect ID (HMAC key)',
			name: 'connectId',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Used to sign Time-Signature = HMAC-SHA1(Time-Stamp, connectId)',
		},
	];
}

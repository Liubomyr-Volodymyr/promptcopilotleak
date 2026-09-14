import { PROJECT_KEY } from '../../common/enums';

export class AssistantAttrs {
	assistantId: string;
	prompt: string;
	project_key: PROJECT_KEY;
}

export class AssistantResponse {
	content: string;
	usage?: {
		[key: string]: number;
	};
}

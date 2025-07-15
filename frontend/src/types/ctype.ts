export interface CTypeSchemaProperties {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'integer';
  };
}

export interface CTypeSchema {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#';
  title: string;
  properties: CTypeSchemaProperties;
  type: 'object';
} 
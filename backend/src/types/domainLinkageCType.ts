// Schema del CType para Domain Linkage
export const domainLinkageCType = {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Domain Linkage',
  properties: {
    id: {
      type: 'string',
    },
    origin: {
      type: 'string',
      format: 'uri',
    },
  },
  type: 'object',
  $id: 'kilt:ctype:0x9d271c790775ee831352291f01c5d04c7979713a5896dcf5e81708184cc5c643',
}; 
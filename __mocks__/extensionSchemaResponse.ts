export const extensionSchemaResponse = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://stac-extensions.github.io/testExtension/v2.2.0/schema.json',
  title: 'Test Extension',
  description: 'A detailed test extension that mimics the datacube schema.',
  oneOf: [
    {
      $comment: 'This is the schema for STAC Collections.',
      type: 'object',
      allOf: [
        {
          required: ['type'],
          properties: {
            type: { const: 'Collection' },
          },
        },
        { $ref: '#/definitions/stac_extensions' },
      ],
      anyOf: [
        {
          allOf: [
            { $ref: '#/definitions/require_field' },
            { $ref: '#/definitions/fields' },
          ],
        },
      ],
    },
  ],
  definitions: {
    stac_extensions: {
      type: 'object',
      required: ['stac_extensions'],
      properties: {
        stac_extensions: {
          type: 'array',
          contains: {
            const:
              'https://stac-extensions.github.io/testExtension/v2.2.0/schema.json',
          },
        },
      },
    },
    require_field: {
      required: ['test:dimensions'],
    },
    fields: {
      type: 'object',
      properties: {
        'test:dimensions': {
          $ref: '#/definitions/test:dimensions',
        },
        'test:bands': {
          $ref: '#/definitions/test:bands',
        },
      },
    },
    'test:dimensions': {
      title: 'Dimensions',
      type: 'object',
      required: ['x', 'y', 'temporal'],
      properties: {
        x: { $ref: '#/definitions/horizontal_spatial_dimension' },
        y: { $ref: '#/definitions/horizontal_spatial_dimension' },
        temporal: { $ref: '#/definitions/temporal_dimension' },
      },
    },
    'test:bands': {
      title: 'Variables',
      type: 'object',
      additionalProperties: {
        $ref: '#/definitions/variable',
      },
    },
    variable: {
      title: 'Variable',
      type: 'object',
      required: ['type', 'dimensions', 'unit'],
      properties: {
        type: { type: 'string' },
        description: { type: 'string' },
        dimensions: { type: 'array', items: { type: 'string' } },
        unit: { type: 'string' },
      },
    },
    horizontal_spatial_dimension: {
      title: 'Horizontal Spatial Dimension',
      type: 'object',
      required: ['type', 'axis', 'extent'],
      properties: {
        type: { type: 'string', const: 'spatial' },
        axis: { type: 'string' },
        extent: { type: 'array', items: { type: 'number' } },
      },
    },
    temporal_dimension: {
      title: 'Temporal Dimension',
      type: 'object',
      required: ['type', 'extent'],
      properties: {
        type: { type: 'string', const: 'temporal' },
        extent: {
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

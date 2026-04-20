'use client';

import React from 'react';
import { Collapse, Row, Col } from 'antd';
import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

const { Panel } = Collapse;

export default function DiscoveryItemObjectFieldTemplate<
  T = Record<string, unknown>,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = Record<string, unknown>,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const { properties, uiSchema, registry } = props;

  const rowGutter =
    (registry.formContext as { rowGutter?: number } | undefined)?.rowGutter ||
    12;

  // We want the "More Options" panel to be collapsed by default
  const defaultActiveKeys: string[] = [];

  // Get the grid definition for this item
  const itemUiGrid = uiSchema?.['ui:grid'] as
    | { [key: string]: number }[]
    | undefined;

  if (!itemUiGrid) {
    // Fallback if no ui:grid is defined for the item
    return (
      <Row gutter={rowGutter}>
        {properties
          .filter((e) => !e.hidden)
          .map((element) => (
            <Col key={element.name} span={24}>
              {element.content}
            </Col>
          ))}
      </Row>
    );
  }

  // Helper function to render a single row from the ui:grid definition
  const renderGridRow = (rowIndex: number) => {
    if (!itemUiGrid[rowIndex]) return null;

    const rowDefinition = itemUiGrid[rowIndex];
    return (
      <Row key={`grid-row-${rowIndex}`} gutter={rowGutter}>
        {Object.keys(rowDefinition).map((fieldName) => {
          const element = properties.find((p) => p.name === fieldName);
          return element ? (
            <Col key={element.name} span={rowDefinition[fieldName]}>
              {element.content}
            </Col>
          ) : null;
        })}
      </Row>
    );
  };

  return (
    <>
      {/* Always Visible Sections */}
      {renderGridRow(0)} {/* discovery, prefix, bucket */}
      {renderGridRow(1)} {/* filename_regex */}
      {/* Collapsible "More Options" Section */}
      {/* The Collapse component wraps only the "More Options" panel */}
      <Collapse defaultActiveKey={defaultActiveKeys}>
        <Panel header="More Options" key="more-options">
          {renderGridRow(2)} {/* datetime_range */}
          {renderGridRow(3)} {/* stac_extensions, links */}
          {renderGridRow(4)}{' '}
          {/* start_datetime, end_datetime, single_datetime */}
          {renderGridRow(5)} {/* id_regex, id_template, use_multithreading */}
          {/* Render any additional env-configured rows */}
          {itemUiGrid &&
            itemUiGrid.length > 5 &&
            itemUiGrid.slice(5).map((_, idx) => renderGridRow(5 + idx + 1))}
        </Panel>
      </Collapse>
    </>
  );
}

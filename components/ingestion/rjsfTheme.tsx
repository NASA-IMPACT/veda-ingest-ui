/**
 * RJSF v6 + Ant Design v5 Theme Compatibility Layer
 *
 * This file provides custom button implementations for RJSF v6 to work with Next.js.
 *
 * Issue: @rjsf/antd v6.2.5 imports Ant Design icons with `.js` extensions
 * (e.g., '@ant-design/icons/DeleteOutlined.js') which Next.js cannot properly
 * resolve in its webpack bundler, causing "Element type is invalid: got object"
 * errors when rendering array field buttons (RemoveButton, AddButton, etc.).
 *
 * Solution: Override all ButtonTemplates with custom implementations that import
 * icons directly from '@ant-design/icons' without file extensions, allowing
 * Next.js to properly resolve them during the build process.
 *
 * This workaround can be removed when either:
 * - @rjsf/antd fixes icon imports to be Next.js compatible, or
 * - We upgrade to a version that doesn't have this issue
 */
import React from 'react';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import { Button } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  IconButtonProps,
  RJSFSchema,
  TemplatesType,
  TranslatableString,
  getUiOptions,
  GenericObjectType,
} from '@rjsf/utils';

// Custom IconButton that works with Next.js
function IconButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    iconType = 'default',
    icon,
    onClick,
    uiSchema,
    registry,
    ...otherProps
  } = props;

  return (
    <Button
      onClick={onClick}
      // @ts-expect-error TS2322 - iconType can be various button types
      type={iconType}
      icon={icon}
      style={{ paddingTop: '4px' }}
      {...otherProps}
    />
  );
}

// Custom button implementations with correct icon imports for Next.js
function AddButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.AddItemButton)}
      iconType="primary"
      {...props}
      icon={<PlusCircleOutlined />}
      // @ts-expect-error block is valid but not in IconButtonProps type
      block={true}
    />
  );
}

function CopyButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.CopyButton)}
      {...props}
      icon={<CopyOutlined />}
    />
  );
}

function MoveDownButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<ArrowDownOutlined />}
    />
  );
}

function MoveUpButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={<ArrowUpOutlined />}
    />
  );
}

function RemoveButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const options = getUiOptions(props.uiSchema);
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.RemoveButton)}
      iconType="primary"
      {...props}
      icon={<DeleteOutlined />}
      // @ts-expect-error danger and block are valid but not in IconButtonProps type
      danger={true}
      block={!!options.block}
    />
  );
}

function ClearButton<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends GenericObjectType = any,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.ClearButton)}
      iconType="link"
      {...props}
      icon={<CloseOutlined />}
    />
  );
}

const baseTemplates = (AntDTheme.templates ?? {}) as TemplatesType<
  any,
  RJSFSchema,
  any
>;

const FixedAntDTheme = {
  ...AntDTheme,
  templates: {
    ...baseTemplates,
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton: baseTemplates.ButtonTemplates?.SubmitButton,
      ClearButton,
    },
  } as TemplatesType<any, RJSFSchema, any>,
};

export const Form = withTheme(FixedAntDTheme);
export const RJSFTheme = FixedAntDTheme;

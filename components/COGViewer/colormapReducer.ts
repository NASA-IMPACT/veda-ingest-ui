import type { Dispatch } from 'react';

export type ColormapType = 'named' | 'custom';

export type ColormapState = {
  type: ColormapType;
  selected: string;
  customJson: string;
};

export type ColormapAction =
  | { type: 'SET_TYPE'; value: ColormapType }
  | { type: 'SET_COLORMAP'; value: string }
  | { type: 'SET_CUSTOM_JSON'; value: string }
  | { type: 'INIT'; state: ColormapState };

export function colormapReducer(
  state: ColormapState,
  action: ColormapAction
): ColormapState {
  switch (action.type) {
    case 'SET_TYPE':
      return { ...state, type: action.value };
    case 'SET_COLORMAP':
      return { ...state, selected: action.value };
    case 'SET_CUSTOM_JSON':
      return { ...state, customJson: action.value };
    case 'INIT':
      return action.state;
  }
}

export const initialColormapState: ColormapState = {
  type: 'named',
  selected: 'Internal',
  customJson: '',
};

export type ColormapContext = ColormapState & {
  dispatch: Dispatch<ColormapAction>;
};

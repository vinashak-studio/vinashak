import { showAsRequired, isDateControl, isDescriptionHidden, isTimeControl, or, rankWith } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import TextField from "@mui/material/TextField";
import merge from "lodash/merge";

import { useDebouncedChange, useFocus } from "../util";

const TailwindNative = (props) => {
  const [focused, onFocus, onBlur] = useFocus();
  const { id, errors, label, schema, description, enabled, visible, required, path, handleChange, data, config, uischema } = props;

  if (!visible) return null;

  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const [inputValue, onChange] = useDebouncedChange(handleChange, "", data, path);
  const fieldType = appliedUiSchemaOptions.format ?? schema.format;
  const showDescription = !isDescriptionHidden(visible, description, focused, appliedUiSchemaOptions.showUnfocusedDescription);

  return (
    <TextField
      required={showAsRequired(required, appliedUiSchemaOptions.hideRequiredAsterisk)}
      id={id + "-input"}
      label={label}
      type={fieldType}
      error={!isValid}
      disabled={!enabled}
      fullWidth={!appliedUiSchemaOptions.trim}
      onFocus={onFocus}
      onBlur={onBlur}
      helperText={!isValid ? errors : showDescription ? description : null}
      InputLabelProps={{ shrink: true }}
      value={inputValue || ""}
      onChange={onChange}
    />
  );
};

export const tailwindNativeControlTester = rankWith(1002, or(isDateControl, isTimeControl));

export const TailwindNativeControl = withJsonFormsControlProps(TailwindNative);

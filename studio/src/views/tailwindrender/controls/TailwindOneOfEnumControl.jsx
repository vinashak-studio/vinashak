import ReactSelect from "react-select";
import { isOneOfEnumControl, rankWith } from "@jsonforms/core";
import { withJsonFormsOneOfEnumProps } from "@jsonforms/react";

import LabelRenderer from "../renderers/common/LabelRenderer";
import { ReactSelectCustomStyles } from "../common/Constants";
import { useEffect } from "react";

export const TailwindOneOfEnum = (props) => {
  const { handleChange, path, visible, label, options, data, schema } = props;

  const handleSelectChange = (selectedOption) => selectedOption && handleChange(path, selectedOption.value);

  useEffect(() => {
    if (data != undefined && schema?.default != undefined) {
      handleSelectChange(options?.find((item) => item.value === schema.default));
    }
  }, [data]);

  if (!visible) return null;

  return (
    <div className="mx-1">
      {label?.length > 0 && <LabelRenderer {...props} />}
      <ReactSelect
        value={options.find((option) => option.value === props.data)}
        onChange={(option) => handleSelectChange(option)}
        options={options}
        isSearchable={true}
        className="rounded border text-slate-700 placeholder-slate-500 shadow focus:shadow-md"
        styles={ReactSelectCustomStyles}
      />
    </div>
  );
};

export const tailwindOneOfEnumControlTester = rankWith(1005, isOneOfEnumControl);

export const TailwindOneOfEnumControl = withJsonFormsOneOfEnumProps(TailwindOneOfEnum);

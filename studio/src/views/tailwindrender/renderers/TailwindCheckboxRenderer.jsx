import React from "react";
import LabelRenderer from "./common/LabelRenderer";

/**
 * Default renderer for a checkbox/boolean.
 */
const TailwindCheckboxRenderer = React.memo((props) => {
  const checked = Boolean(props.data);
  return (
    <>
      {props.visible && (
        <div
          className={`flex flex-row ${Boolean(props.removeMt) ? "mb-2" : "mt-4"} min-h-[26px] items-center border border-slate-200 rounded mb-1.5 ${
            props.enabled ? "bg-white" : "bg-slate-200"
          } shadow grow mx-1`}
        >
          <input
            disabled={!props.enabled}
            type="checkbox"
            name={props.path}
            id={props.id}
            className="text-color-0500 ring-blue-500 rounded mx-2"
            placeholder={props.description}
            checked={checked}
            onChange={(ev) => props.handleChange(props.path, ev.target.checked)}
          />
          {props.label?.length > 0 && <LabelRenderer {...props} fontSize="12px" />}
        </div>
      )}
    </>
  );
});

export default TailwindCheckboxRenderer;

import { and, isIntegerControl, optionIs, rankWith } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import LabelRenderer from "../renderers/common/LabelRenderer";
import { convertMsToHM } from "../util/converter";

function TailwindTimeInteger({ visible, path, data, handleChange, ...props }) {
  if (!visible) return null;

  const { hours, minutes, seconds } = convertMsToHM(data || 0);
  return (
    <div className="grid grid-cols-4 gap-2 items-center px-2">
      <LabelRenderer fontSize="14px" path={path} {...props} />
      <div>
        <LabelRenderer path={path} label="Hour(s)" description="Select Hour(s)" />
        <input
          type="number"
          step={1}
          name={path + ":Hours"}
          id={path + ":Hours"}
          onWheel={(ev) => ev.target.blur()}
          autoComplete="off"
          className={`text-xs caret-slate-300 block px-1.5 py-0.5 rounded border placeholder-slate-500 shadow focus:shadow-md focus:border-color-0600 border-slate-300 focus:outline-none w-full ${
            !props.enabled && "bg-slate-200"
          }`}
          value={hours}
          disabled={!props.enabled}
          onChange={(ev) => {
            ev.preventDefault();
            const value = Number(ev.target.value);
            if (value >= 0 && value < 24) {
              const sec = value * 60 * 60 + minutes * 60 + seconds;
              handleChange(path, Number(sec) * 1000);
            }
          }}
        />
      </div>
      <div>
        <LabelRenderer path={path} label="Minute(s)" description="Select Minute(s)" />
        <input
          type="number"
          step={1}
          name={path + ":Minutes"}
          id={path + ":Minutes"}
          onWheel={(ev) => ev.target.blur()}
          autoComplete="off"
          className={`text-xs caret-slate-300 block px-1.5 py-0.5 rounded border placeholder-slate-500 shadow focus:shadow-md focus:border-color-0600 border-slate-300 focus:outline-none w-full ${
            !props.enabled && "bg-slate-200"
          }`}
          value={minutes}
          disabled={!props.enabled}
          onChange={(ev) => {
            ev.preventDefault();
            const value = Number(ev.target.value);
            if (value >= 0 && value < 60) {
              const sec = hours * 60 * 60 + value * 60 + seconds;
              handleChange(path, Number(sec) * 1000);
            }
          }}
        />
      </div>
      <div>
        <LabelRenderer path={path} label="Second(s)" description="Select Second(s)" />
        <input
          type="number"
          step={1}
          name={path + ":Seconds"}
          id={path + ":Seconds"}
          autoComplete="off"
          onWheel={(ev) => ev.target.blur()}
          className={`text-xs caret-slate-300 block px-1.5 py-0.5 rounded border placeholder-slate-500 shadow focus:shadow-md focus:border-color-0600 border-slate-300 focus:outline-none w-full ${
            !props.enabled && "bg-slate-200"
          }`}
          value={seconds}
          disabled={!props.enabled}
          onChange={(ev) => {
            ev.preventDefault();
            const value = Number(ev.target.value);
            if (value >= 0 && value < 60) {
              const sec = hours * 60 * 60 + minutes * 60 + value;
              handleChange(path, Number(sec) * 1000);
            }
          }}
        />
      </div>
    </div>
  );
}

export const tailwindTimeIntegerControlTester = rankWith(2001, and(isIntegerControl, optionIs("format", "time")));

export const TailwindTimeIntegerControl = withJsonFormsControlProps(TailwindTimeInteger);

import {
  InputGuardrail,
  OutputGuardrail,
  InputGuardrailArgs,
  OutputGuardrailArgs,
  InputGuardrailResult,
  OutputGuardrailResult,
} from "@voltagent/core";

/* -------------------------------------------------
   TELEMETRY RUNTIME SHAPE (NOT PART OF PUBLIC TYPES)
-------------------------------------------------- */

type TelemetryEmitter = {
  emit(event: {
    event_type: string;
    name: string;
    status: string;
    metadata?: Record<string, unknown>;
  }): void;
};

/* -------------------------------------------------
   INPUT GUARDRAIL WRAPPER
-------------------------------------------------- */

export function withInputGuardrailTelemetry(
  guardrail: InputGuardrail,
  name: string
): InputGuardrail {
  if (typeof guardrail === "function") {
    return async function wrappedInputGuardrail(
      args: InputGuardrailArgs
    ): Promise<InputGuardrailResult> {
      const result = await guardrail(args);

      const telemetry = (args as any).telemetry as
        | TelemetryEmitter
        | undefined;

      telemetry?.emit({
        event_type: "GUARDRAIL",
        name,
        status:
          result?.action === "modify"
            ? "modified"
            : result?.pass
            ? "passed"
            : "blocked",
        metadata: {
          type: "input",
          inputText: args.inputText,
          modifiedInput: result?.modifiedInput,
          ...result?.metadata,
        },
      });

      return result;
    };
  }

  return {
    ...guardrail,
    id: name,

    async handler(args: InputGuardrailArgs) {
      const result = await guardrail.handler(args);

      const telemetry = (args as any).telemetry as
        | TelemetryEmitter
        | undefined;

      telemetry?.emit({
        event_type: "GUARDRAIL",
        name,
        status:
          result?.action === "modify"
            ? "modified"
            : result?.pass
            ? "passed"
            : "blocked",
        metadata: {
          type: "input",
          inputText: args.inputText,
          modifiedInput: result?.modifiedInput,
          ...result?.metadata,
        },
      });

      return result;
    },
  };
}

/* -------------------------------------------------
   OUTPUT GUARDRAIL WRAPPER (GENERIC SAFE)
-------------------------------------------------- */

export function withOutputGuardrailTelemetry<T>(
  guardrail: OutputGuardrail<T>,
  name: string
): OutputGuardrail<T> {
  if (typeof guardrail === "function") {
    return async function wrappedOutputGuardrail(
      args: OutputGuardrailArgs<T>
    ): Promise<OutputGuardrailResult<T>> {
      const result = await guardrail(args);

      const telemetry = (args as any).telemetry as
        | TelemetryEmitter
        | undefined;

      telemetry?.emit({
        event_type: "GUARDRAIL",
        name,
        status: result?.pass ? "passed" : "blocked",
        metadata: {
          type: "output",
          output: args.output,
          ...result?.metadata,
        },
      });

      return result;
    };
  }

  return {
    ...guardrail,
    id: name,

    async handler(args: OutputGuardrailArgs<T>) {
      const result = await guardrail.handler(args);

      const telemetry = (args as any).telemetry as
        | TelemetryEmitter
        | undefined;

      telemetry?.emit({
        event_type: "GUARDRAIL",
        name,
        status: result?.pass ? "passed" : "blocked",
        metadata: {
          type: "output",
          output: args.output,
          ...result?.metadata,
        },
      });

      return result;
    },
  };
}

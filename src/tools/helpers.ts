import { IToolDefinition, IToolProperties } from "../types.js";

export function createToolDefinition(
  name: string,
  description: string,
  properties: IToolProperties,
  strict = true,
  additionalProperties = false,
  optionalPropertiesList: string[] = []
): IToolDefinition {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties,
        required: Object.keys(properties).filter((key) =>
          optionalPropertiesList.includes(key)
        ),
        additionalProperties,
      },
      strict,
    },
  };
}

export interface FormApi<T> {
  setFieldValue: (name: keyof T, value: number | boolean | string) => void;
  state: {
    values: T;
    isValid: boolean;
  };
  AppField: (props: {
    name: keyof T;
    children: (field: {
      name: string;
      state: { value: number | boolean | string };
      handleBlur: () => void;
      handleChange: (value: number | boolean | string) => void;
      FieldContainer: React.ComponentType<{ children: React.ReactNode }>;
      FieldLabel: React.ComponentType<{ children: React.ReactNode }>;
      FieldMessage: React.ComponentType;
    }) => React.ReactNode;
  }) => React.ReactNode;
}

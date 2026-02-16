export interface StepHandle {
   submit: () => Promise<boolean>;
   canContinue: boolean;
   isPending: boolean;
}

export interface StepState {
   canContinue: boolean;
   isPending: boolean;
}

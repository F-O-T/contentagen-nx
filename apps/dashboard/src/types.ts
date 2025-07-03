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

export interface IPolarSubscription {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   amount: number;
   currency: string;
   recurringInterval: string;
   status: string;
   currentPeriodStart: Date | null;
   currentPeriodEnd: Date | null;
   cancelAtPeriodEnd: boolean;
   canceledAt: Date | null;
   startedAt: Date | null;
   endsAt: Date | null;
   endedAt: Date | null;
   customerId: string;
   productId: string;
   discountId: string | null;
   checkoutId: string | null;
   customerCancellationReason: string | null;
   customerCancellationComment: string | null;
   product: Product;
   prices: Price2[];
   meters: Meter3[];
}

export interface Product {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   name: string;
   description: string | null;
   recurringInterval: string;
   isRecurring: boolean;
   isArchived: boolean;
   organizationId: string;
   prices: Price[];
   benefits: Benefit[];
   medias: any[];
   organization: Organization;
}

export interface Price {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   amountType: string;
   isArchived: boolean;
   productId: string;
   type: string;
   recurringInterval: string;
   priceCurrency: string;
   priceAmount?: number;
   unitAmount?: string;
   capAmount: number | null;
   meterId?: string;
   meter?: Meter;
}

export interface Meter {
   id: string;
   name: string;
}

export interface Benefit {
   id: string;
   createdAt: Date | null;
   modifiedAt: Date | null;
   type: string;
   description: string;
   selectable: boolean;
   deletable: boolean;
   organizationId: string;
}

export interface Organization {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   name: string;
   slug: string;
   avatarUrl: string | null;
   email: string | null;
   website: string | null;
   socials: any[];
   detailsSubmittedAt: Date | null;
   featureSettings: FeatureSettings;
   subscriptionSettings: SubscriptionSettings;
}

export interface FeatureSettings {
   issueFundingEnabled: boolean;
}

export interface SubscriptionSettings {
   allowMultipleSubscriptions: boolean;
   allowCustomerUpdates: boolean;
   prorationBehavior: string;
}

export interface Price2 {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   amountType: string;
   isArchived: boolean;
   productId: string;
   type: string;
   recurringInterval: string;
   priceCurrency: string;
   unitAmount?: string;
   capAmount: number | null;
   meterId?: string;
   meter?: Meter2;
   priceAmount?: number;
}

export interface Meter2 {
   id: string;
   name: string;
}

export interface Meter3 {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   consumedUnits: number;
   creditedUnits: number;
   amount: number;
   meterId: string;
   meter: Meter4;
}

export interface Meter4 {
   createdAt: Date | null;
   modifiedAt: Date | null;
   id: string;
   name: string;
}

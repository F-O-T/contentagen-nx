/**
 * Job data types for scheduled (cron) jobs.
 * These jobs run via node-cron in the worker process,
 * not through BullMQ queues.
 */

export interface RefreshViewsJobData {
   triggeredAt: string;
}

export interface ReconcileCreditsJobData {
   triggeredAt: string;
}

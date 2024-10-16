export type WorkflowExecutionInfo = {
    startTime: string;
    closeTime: string;
    status: string;
}

export type WorkflowDetails = {
    workflowExecutionInfo: WorkflowExecutionInfo;
}
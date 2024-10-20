import { useStorage } from "@plasmohq/storage/hook";
import { add, sub } from "date-fns";
import { useMemo } from "react";
import type { WorkflowDetails } from './temporalApi';

const WORKFLOW_STATUS_COMPLETED = 'WORKFLOW_EXECUTION_STATUS_COMPLETED';


const GrafanaLink: React.FC<{
    pageDetails: {
        workflowId: string;
        workflowRunId: string;
        namespace: string;
    };
    workflowDetails: WorkflowDetails;
}> = ({
    pageDetails,
    workflowDetails,
}) => {
        const [baseUrl] = useStorage("baseUrl");
        const [expression] = useStorage("expression");

        const queryStartTime = useMemo(() => {
            return sub(workflowDetails.workflowExecutionInfo.startTime, { minutes: 10 });
        }, [workflowDetails]);

        const endTime = useMemo(() => {
            if (workflowDetails.workflowExecutionInfo.status !== WORKFLOW_STATUS_COMPLETED) {
                return add(new Date(), { hours: 3 });
            }

            return add(workflowDetails.workflowExecutionInfo.closeTime, { minutes: 10 });
        }, [workflowDetails]);

        const fullExpression = useMemo(() => {
            if (!expression) {
                return '';
            }

            return expression.replaceAll('__WORKFLOW_RUN_ID__', pageDetails.workflowRunId);
        }, [expression, pageDetails, queryStartTime, endTime]);

        const url = useMemo(() => {
            if (!baseUrl) {
                return new URL('about:blank');
            }

            const urlParam = {
                ptl: {
                    dataSource: "grafanacloud-logs",
                    queries: [
                        {
                            dataSource: {
                                type: 'loki',
                                uid: 'grafanacloud-logs',
                            },
                            datasource: {
                                type: 'loki',
                                uid: 'grafanacloud-logs',
                            },
                            editorMode: 'code',
                            expr: fullExpression,
                            maxLines: 5000,
                            queryType: 'range',
                            refId: 'WorkflowLogs',
                            hide: false,
                        },
                    ],
                    range: {
                        from: queryStartTime,
                        to: endTime,
                    },
                    panelsState: {
                        logs: {
                            visualisationType: 'logs',
                        },
                    }
                },
            };

            const searchParams = new URLSearchParams();
            searchParams.append('schemaVersion', '1');
            searchParams.append('panes', JSON.stringify(urlParam));
            searchParams.append('orgId', '1');
            const result = new URL(baseUrl);
            result.search = searchParams.toString();

            return result;
        }, [fullExpression, queryStartTime, endTime, baseUrl]);


        return (
            <div>
                {!expression && <div className="text-red-500">Please set the expression in the extension popup</div>}
                <button
                    onClick={() => window.open(url.toString(), '_blank')}
                    className="relative flex w-fit items-center justify-center border-2 gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow focus-visible:outline-none focus-visible:border-inverse focus-visible:ring-4 whitespace-nowrap no-underline [.button-group>&]:rounded-none [.button-group>&:first-child]:rounded-l-lg [.button-group>&:last-child]:rounded-r-lg [.input-group>&]:rounded-none last:[.input-group>&]:rounded-r first:[.input-group>&]:rounded-l surface-interactive border-transparent text-white focus-visible:ring-primary/70 h-10 text-base px-4 py-2">
                    Logs
                </button>
            </div>
        )
    }

export default GrafanaLink;

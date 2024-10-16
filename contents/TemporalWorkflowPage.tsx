import { Mutex } from 'async-mutex';
import type { PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoRender } from "plasmo";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import GrafanaLink from "~core/GrafanaLink";
import type { WorkflowDetails } from "~core/temporalApi";

export const config: PlasmoCSConfig = {
    matches: ["https://cloud.temporal.io/*"],
}

const URL_PATTERN = /\/namespaces\/(?<namespace>.*?)\/workflows\/(?<workflow_id>.*?)\/(?<workflow_run_id>.*?)\/history/;

const Render = () => {
    const [isLoading, setIsLoading] = useState(true);

    const [response, setResponse] = useState<WorkflowDetails | null>(null);

    const pageDetails = useMemo(() => {
        const pageLocation = window.location.href;
        const match = pageLocation.match(URL_PATTERN);
        const workflowId = match.groups["workflow_id"];
        const workflowRunId = match.groups["workflow_run_id"];
        const namespace = match.groups["namespace"];
        console.log("workflow_id: ", workflowId);
        console.log("workflow_run_id: ", workflowRunId);
        console.log("namespace: ", namespace);

        return {
            workflowId,
            workflowRunId,
            namespace
        }
    }, [window.location.href]);

    // useEffect(() => {
    //     (async () => {
    //         const resp = await sendToBackground({
    //             name: "ping",
    //             body: {
    //                 id: 123
    //             },
    //             extensionId: 'kfnoinohabmgmnlpcaepalmapmmhneaf', // find this in chrome's extension manager
    //         });

    //         console.log("ping response: ", resp);
    //     })()
    // }, [])


    useEffect(() => {
        // get accessToken from local storage
        const authUser = localStorage.getItem("AuthUser");
        if (!authUser) {
            console.log("authUser not found!");
            return;
        }
        const accessToken = JSON.parse(authUser).accessToken;

        const requestUrl = `https://${pageDetails.namespace}.web.tmprl.cloud/api/v1/namespaces/${pageDetails.namespace}/workflows/${pageDetails.workflowId}?execution.runId=${pageDetails.workflowRunId}`;
        console.log("request: ", requestUrl);
        fetch(requestUrl, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        }).then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch workflow details");
            }
            return response.json()
        }).then((contentResp) => {
            setResponse(contentResp as WorkflowDetails);
            (window as any).__DEBUG__ = {
                pageDetails,
                contentResp,
            };
            setIsLoading(false);
        }).catch((error) => {
            console.error("Error fetching workflow details: ", error);
            setIsLoading(false);
        });
    }, [pageDetails]);

    return (
        <section style={{
            display: "flex",
            width: "100%",
        }}>
            {isLoading && <div>Loading...</div>}
            <aside style={{
                marginLeft: "auto",
                padding: "0 0.5rem",
            }}>
                {response && pageDetails && <GrafanaLink pageDetails={pageDetails} workflowDetails={response} />}
            </aside>
        </section>
    )
}


// If inline is needed:
// export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
//     element: document.querySelector("main#content header > div"),
//     insertPosition: "afterend",
// });


export const getRootContainer = async () => {
    await waitForElement("main#content header > div")
    const rootContainerParent = document.querySelector(`main#content header > div`)
    if (!rootContainerParent) {
        throw new Error("Root container parent not found")
    }

    const parent = rootContainerParent.parentElement;

    const rootContainer = document.createElement("custom-element")
    parent.insertBefore(rootContainer, rootContainerParent.nextSibling);

    return rootContainer;
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
    createRootContainer
}) => {
    const config = { childList: true, subtree: true };

    const mutex = new Mutex();

    let oldUrl: undefined | string = undefined;

    const tryToMountComponent = async () => {
        await mutex.runExclusive(async () => {
            if (oldUrl === window.location.href) {
                return;
            }
            oldUrl = window.location.href;
            if (!window.location.href.match(URL_PATTERN)) {
                return;
            }

            const existingElem = document.querySelector("custom-element");
            if (existingElem) {
                return;
            }

            const rootContainer = await createRootContainer()
            const root = createRoot(rootContainer)
            root.render(<Render />)
        })
    }
    const observer = new MutationObserver(tryToMountComponent);

    observer.observe(document.body, config);
}

// use animationFrame to wait for element to be available
const waitForElement = async (selector: string) => {
    return new Promise((resolve) => {
        const isExists = () => {
            const elem = document.querySelector(selector);
            if (elem) {
                resolve(elem);
                return;
            }
            requestAnimationFrame(isExists);
        }

        isExists();
    })
}


export default Render;

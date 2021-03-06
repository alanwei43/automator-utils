
export interface IProxyAgentManager {
    getProxyAgent(reqUrl: string): Promise<ProxyAgentResult>
    onRequestError(error: any, retryCount: number): Promise<void>
}


export interface ProxyAgentResult {
    host: string
    port: number
    type: "sock5" | "http"
}
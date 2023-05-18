declare class Queue {
    constructor(
        ref: Reference,
        handler: (
            data: any,
            progress: number,
            resolve: () => void,
            reject: () => void,
        ) => Promise<void>,
    )
    shutdown(): Promise<void>
}

declare module 'firebase-queue' {
    export = Queue
}

import { useCallback, useEffect, useState } from 'react'

function useAPis<
    T extends (
        ...args: Parameters<T>
    ) => Promise<ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>>,
>({
    instantCall = false,
    api,
    args,
}: {
    instantCall?: boolean
    api: T
    args?: Parameters<T>
}): {
    loading: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors?: Array<any> | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response:
        | (ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>)
        | undefined
    request(..._args: Parameters<T>): Promise<void>
} {
    const [loading, setLoading] = useState<boolean>(instantCall)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [errors, setErrors] = useState<Array<any> | null>(null)
    const [response, setResponse] = useState<
        (ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>) | undefined
    >(undefined)

    useEffect(() => {
        if (!instantCall) return
        if (args) request(...(args as Parameters<T>))
    }, [instantCall])

    const request = useCallback(async (..._args: Parameters<T>) => {
        if (!api) return
        setLoading(true)
        setErrors(null)
        api(..._args)
            .then((response) => {
                setResponse(response)
                setLoading(false)
            })
            .catch((errors) => {
                setErrors(errors)
                setLoading(false)
            })
    }, [])

    return {
        loading,
        errors,
        response,
        request,
    }
}

export { useAPis }

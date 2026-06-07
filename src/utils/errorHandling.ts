import axios from "axios";

export function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ??
            error.response?.data?.error ??
            error.message
        );
    }
    return 'Terjadi kesalahan. Silakan coba lagi.';
}

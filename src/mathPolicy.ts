export function classifyMath(input: string) {
    const cleaned = input.replace(/\s+/g, "");
    const ops = cleaned.match(/[+\-*/]/g)?.length ?? 0;
    const hasDivision = cleaned.includes("/");
    const largeNumber = /\d{3,}/.test(cleaned);

    const isSimple = ops === 1 && !hasDivision && !largeNumber;

    return {
        requiresTool: !isSimple,
    };
}

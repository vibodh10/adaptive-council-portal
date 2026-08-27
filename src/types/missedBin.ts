export type BinType = "general" | "recycling" | "garden";

export type MissedBinReport = {
    address: string;
    binType: BinType;
    expectedCollectionDate: string;
    neighboursAlsoMissed: boolean;
    notes?: string;
}
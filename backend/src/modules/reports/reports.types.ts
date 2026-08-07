export interface ReportContext {
  hospitalId: string;
  userId: string;
  branchId?: string;
  roles: string[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

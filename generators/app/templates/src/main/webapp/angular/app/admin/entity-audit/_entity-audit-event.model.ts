export class EntityAuditEvent {
    id?: string;
    entityId?: string;
    entityType?: string;
    action?: string;
    entityValue?: string;
    commitVersion?: number;
    modifiedBy?: string;
    modifiedDate?: Date;
}

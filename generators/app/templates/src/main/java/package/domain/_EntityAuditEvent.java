package <%=packageName%>.domain;

<% if (databaseType == 'sql' && auditFramework === 'custom') { %>
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;<% }%>
import java.time.ZonedDateTime;
<% if (databaseType == 'sql' && auditFramework === 'custom') { %>
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;<% } else if (databaseType === 'mongodb' && auditFramework === 'javers') {%>
import org.javers.core.commit.CommitMetadata;
import org.javers.core.diff.Change;<% }%>
import java.io.Serializable;
import java.util.Objects;

<% if (databaseType == 'sql' && auditFramework === 'custom') { %>
@Entity
@Table(name = "jhi_entity_audit_event")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)<% } %>
public class EntityAuditEvent implements Serializable{

    private static final long serialVersionUID = 1L;
    <% if (databaseType == 'sql' && auditFramework === 'custom') { %>
  	@Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotNull
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @NotNull
    @Size(max = 255)
    @Column(name = "entity_type", length = 255, nullable = false)
    private String entityType;

    @NotNull
    @Size(max=20)
    @Column(name = "action", length = 20, nullable = false)
    private String action;

    @Column(name = "entity_value")
    private String entityValue;

    @Column(name = "commit_version")
    private Integer commitVersion;

    @Size(max = 100)
    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @NotNull
    @Column(name = "modified_date", nullable = false)
    private ZonedDateTime modifiedDate;
    <% } else if (databaseType === 'mongodb' && auditFramework === 'javers') { %>
    private String id;

    private String entityId;

    private String entityType;

    private String action;

    private String entityValue;

    private Integer commitVersion;

    private String modifiedBy;

    private ZonedDateTime modifiedDate;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }<% } %>

    <% if (databaseType === 'sql' && auditFramework === 'custom') { %>
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }<% } %>
    
    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityValue() {
        return entityValue;
    }

    public void setEntityValue(String entityValue) {
        this.entityValue = entityValue;
    }

    public Integer getCommitVersion() {
        return commitVersion;
    }

    public void setCommitVersion(Integer commitVersion) {
        this.commitVersion = commitVersion;
    }

    public String getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public ZonedDateTime getModifiedDate() {
        return modifiedDate;
    }

    public void setModifiedDate(ZonedDateTime modifiedDate) {
        this.modifiedDate = modifiedDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        EntityAuditEvent entityAuditEvent = (EntityAuditEvent) o;
        return Objects.equals(id, entityAuditEvent.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "EntityAuditEvent{" +
            "id=" + id +
            ", entityId='" + entityId + "'" +
            ", entityType='" + entityType + "'" +
            ", action='" + action + "'" +
            ", entityValue='" + entityValue + "'" +
            ", commitVersion='" + commitVersion + "'" +
            ", modifiedBy='" + modifiedBy + "'" +
            ", modifiedDate='" + modifiedDate + "'" +
            '}';
    }

    <% if (databaseType === 'mongodb' && auditFramework === 'javers') { %>
    public static entityAuditEvent fromJaversChange(Change change) {
      EntityAuditEvent entityAuditEvent = new EntityAuditEvent();

      String action = "";

      if (change instanceof NewObject) {
           action = EntityAuditAction.CREATE.value();
       } else if (change instanceof ValueChange){
           action = EntityAuditAction.UPDATE.value();
           ValueChange pc = (ValueChange) change;
           entityAuditEvent.setEntityValue(pc.getPropertyName());
       } else if (change instanceof ObjectRemoved) {
           action = EntityAuditAction.DELETE.value();
       }

      entityAuditEvent.setAction(action);
      entityAuditEvent.setEntityId(change.getAffectedGlobalId().value());
      entityAuditEvent.setId(change.getAffectedGlobalId().toString());

      if (change.getcommitMetadata().isPresent()) {
        CommitMetadata commitMetadata = change.getCommitMetadata().get();
            entityAuditEvent.setModifiedBy(commitMetadata.getAuthor());
            int version = (int)Math.round(commitMetadata.getId().getMajorId());
            entityAuditEvent.setCommitVersion(version);
        // Convert Joda date from commit to ZonedDateTime of java8
        // Use commitversion and id
      }


     return entityAuditEvent;

    }<% }%>

}

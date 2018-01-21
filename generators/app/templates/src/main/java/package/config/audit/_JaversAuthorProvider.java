package <%=packageName%>.config.audit;

import <%=packageName%>.config.Constants;
import <%=packageName%>.security.SecurityUtils;
import org.javers.spring.auditable.AuthorProvider;
import org.springframework.stereotype.Component;

@Component
public class JaversAuthorProvider implements AuthorProvider {

   @Override
   public String provide() {
       return SecurityUtils.getCurrentUserLogin().orElse(Constants.SYSTEM_ACCOUNT);
   }
}

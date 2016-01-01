package <%=packageName%>.config.util;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * configuration class to create an AutowireHelper bean
 */
@Configuration
public class AutowireHelperConfig {
    @Bean
    public AutowireHelper autowireHelper(){
        return new AutowireHelper();
    }

}

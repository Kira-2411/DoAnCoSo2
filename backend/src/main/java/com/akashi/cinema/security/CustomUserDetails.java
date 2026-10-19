package com.akashi.cinema.security;

import com.akashi.cinema.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final Integer userId;
    private final String email;
    private final String password;
    private final Role role;
    private final boolean active;
    private final boolean emailVerified;

    public CustomUserDetails(Integer userId, String email, String password, Role role, boolean active, boolean emailVerified) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.role = role;
        this.active = active;
        this.emailVerified = emailVerified;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active && emailVerified;
    }

    public static class Builder {
        private Integer userId;
        private String email;
        private String password;
        private Role role;
        private boolean active;
        private boolean emailVerified;

        public Builder userId(Integer userId) {
            this.userId = userId;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder role(Role role) {
            this.role = role;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public CustomUserDetails build() {
            return new CustomUserDetails(userId, email, password, role, active, emailVerified);
        }
    }
}

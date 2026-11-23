package com.akashi.cinema.dto.request;

import com.akashi.cinema.enums.Role;

public class UpdateRoleRequest {

    private Role role;
    private Role newRole;

    public UpdateRoleRequest() {
    }

    public UpdateRoleRequest(Role role) {
        this.role = role;
    }

    public Role getRole() {
        return role != null ? role : newRole;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Role getNewRole() {
        return newRole;
    }

    public void setNewRole(Role newRole) {
        this.newRole = newRole;
    }
}

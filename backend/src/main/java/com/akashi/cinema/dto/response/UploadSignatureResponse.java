package com.akashi.cinema.dto.response;

import java.util.Map;

public class UploadSignatureResponse {

    private String cloudName;
    private String apiKey;
    private String uploadUrl;
    private String signature;
    private Map<String, Object> params;

    public UploadSignatureResponse() {
    }

    public UploadSignatureResponse(String cloudName, String apiKey, String uploadUrl, String signature, Map<String, Object> params) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.uploadUrl = uploadUrl;
        this.signature = signature;
        this.params = params;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getCloudName() {
        return cloudName;
    }

    public void setCloudName(String cloudName) {
        this.cloudName = cloudName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params;
    }

    public static class Builder {
        private String cloudName;
        private String apiKey;
        private String uploadUrl;
        private String signature;
        private Map<String, Object> params;

        public Builder cloudName(String cloudName) {
            this.cloudName = cloudName;
            return this;
        }

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder uploadUrl(String uploadUrl) {
            this.uploadUrl = uploadUrl;
            return this;
        }

        public Builder signature(String signature) {
            this.signature = signature;
            return this;
        }

        public Builder params(Map<String, Object> params) {
            this.params = params;
            return this;
        }

        public UploadSignatureResponse build() {
            return new UploadSignatureResponse(cloudName, apiKey, uploadUrl, signature, params);
        }
    }
}

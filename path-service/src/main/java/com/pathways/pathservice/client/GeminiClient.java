package com.pathways.pathservice.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathways.pathservice.dto.GeminiPathResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private final WebClient webClient;
    private final String apiKey;
    private final String apiUrl;
    private final String groqApiKey;
    private final String groqApiUrl;
    private final String groqModel;
    private final ObjectMapper objectMapper;

    public GeminiClient(
            WebClient.Builder webClientBuilder,
            @Value("${gemini.apiKey}") String apiKey,
            @Value("${gemini.url}") String apiUrl,
            @Value("${groq.apiKey:}") String groqApiKey,
            @Value("${groq.apiUrl:https://api.groq.com/openai/v1/chat/completions}") String groqApiUrl,
            @Value("${groq.model:llama-3.3-70b-versatile}") String groqModel,
            ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.groqApiKey = groqApiKey;
        this.groqApiUrl = groqApiUrl;
        this.groqModel = groqModel;
        this.objectMapper = objectMapper;
    }

    public GeminiPathResponse generateLearningPath(String skill, String level, String goal, String studyHours, String learningStyle) {
        String prompt = buildPrompt(skill, level, goal, studyHours, learningStyle);

        // Try calling Groq if configured
        if (groqApiKey != null && !groqApiKey.trim().isEmpty()) {
            try {
                Map<String, Object> userMessage = new HashMap<>();
                userMessage.put("role", "user");
                userMessage.put("content", prompt);

                Map<String, Object> responseFormat = new HashMap<>();
                responseFormat.put("type", "json_object");

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", groqModel);
                requestBody.put("response_format", responseFormat);
                requestBody.put("messages", List.of(userMessage));

                Map<String, Object> response = webClient.post()
                        .uri(groqApiUrl)
                        .header("Authorization", "Bearer " + groqApiKey)
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response == null || !response.containsKey("choices")) {
                    throw new RuntimeException("Invalid response from Groq API");
                }

                List<?> choices = (List<?>) response.get("choices");
                if (choices.isEmpty()) {
                    throw new RuntimeException("No choices returned from Groq");
                }

                Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                Map<?, ?> message = (Map<?, ?>) choice.get("message");
                String content = (String) message.get("content");

                System.out.println("Raw Groq Output: " + content);

                return objectMapper.readValue(content, GeminiPathResponse.class);

            } catch (Exception e) {
                System.err.println("[WARNING] Groq API call failed: " + e.getMessage() + ". Falling back to offline curriculum generator...");
                return getFallbackPathResponse(skill, level, goal, studyHours, learningStyle);
            }
        }

        // Construct request payload
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        requestBody.put("generationConfig", generationConfig);

        try {
            // Call Gemini API
            Map<String, Object> response = webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("candidates")) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid response from Gemini API");
            }

            // Extract the generated text
            List<?> candidates = (List<?>) response.get("candidates");
            if (candidates.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No candidates returned from Gemini");
            }

            Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> contentMap = (Map<?, ?>) candidate.get("content");
            List<?> parts = (List<?>) contentMap.get("parts");
            Map<?, ?> partMap = (Map<?, ?>) parts.get(0);
            String rawJsonText = (String) partMap.get("text");

            System.out.println("Raw Gemini Output: " + rawJsonText);

            // Clean up backticks if any (usually not present when responseMimeType is JSON, but good for safety)
            if (rawJsonText.trim().startsWith("```")) {
                rawJsonText = rawJsonText.trim()
                        .replaceAll("^```json", "")
                        .replaceAll("^```", "")
                        .replaceAll("```$", "")
                        .trim();
            }

            return objectMapper.readValue(rawJsonText, GeminiPathResponse.class);

        } catch (Exception e) {
            System.err.println("[WARNING] Gemini API call failed: " + e.getMessage() + ". Falling back to offline curriculum generator...");
            return getFallbackPathResponse(skill, level, goal, studyHours, learningStyle);
        }
    }

    private String buildPrompt(String skill, String level, String goal, String studyHours, String learningStyle) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert curriculum designer. Generate a highly personalized and structured learning path for learning ")
                .append(skill).append(" at the ").append(level).append(" level.\n");
        
        if (goal != null && !goal.trim().isEmpty()) {
            prompt.append("The user's primary goal is: ").append(goal).append(".\n");
        }
        
        if (studyHours != null && !studyHours.trim().isEmpty()) {
            prompt.append("The user can dedicate ").append(studyHours).append(" per week for study. ")
                  .append("Scale the weekly depth, scope, and amount of topics accordingly so it fits their time budget. ")
                  .append("If they have a very light schedule (e.g., 1-3 hours/week), focus on the absolute essentials and generate fewer weeks or fewer topics per week. ")
                  .append("If they have a full-time or intense schedule, make the curriculum comprehensive and challenging.\n");
        }
        
        if (learningStyle != null && !learningStyle.trim().isEmpty()) {
            prompt.append("The user's preferred learning style is: ").append(learningStyle).append(".\n")
                  .append("Format the curriculum to align with this style:\n");
            
            if (learningStyle.toLowerCase().contains("practical") || learningStyle.toLowerCase().contains("project")) {
                prompt.append("- Emphasize hands-on coding milestones, building small projects each week, and practical labs. ")
                      .append("Make weekly themes and topics action-oriented.\n");
            } else if (learningStyle.toLowerCase().contains("theory") || learningStyle.toLowerCase().contains("academic")) {
                prompt.append("- Emphasize conceptual fundamentals, underlying math/algorithms, deep architectural theories, and academic reading topics.\n");
            } else if (learningStyle.toLowerCase().contains("document") || learningStyle.toLowerCase().contains("reference")) {
                prompt.append("- Emphasize reading official specifications, guides, and documentation. Focus topics on mastering library/tool features through their official documentation.\n");
            } else if (learningStyle.toLowerCase().contains("visual") || learningStyle.toLowerCase().contains("tutorial")) {
                prompt.append("- Focus on structured tutorials, walk-through guides, and visually-verifiable learning achievements.\n");
            }
        }

        prompt.append("\nRules:\n")
              .append("1. Keep it structured strictly into weeks (generate between 4 to 8 weeks depending on complexity and the user's available time).\n")
              .append("2. Each week must have a theme, 2 to 3 objectives, and 3 to 5 key topics.\n")
              .append("3. Each topic must have a title, short description, and a 'suggestedDocUrl' which is a real official documentation link or highly reputable article link for that topic (e.g., MDN, React Docs, Spring Docs, Wikipedia, etc.). The suggestedDocUrl must be a specific, real URL for that topic. Do NOT use placeholder URLs like 'https://example.com/docs' under any circumstances.\n")
              .append("4. Your response must be valid JSON matching the following schema structure, with no markdown formatting tags:\n")
              .append("{\n")
              .append("  \"weeks\": [\n")
              .append("    {\n")
              .append("      \"weekNumber\": 1,\n")
              .append("      \"theme\": \"Week Theme Title\",\n")
              .append("      \"objectives\": [\"Objective 1\", \"Objective 2\"],\n")
              .append("      \"topics\": [\n")
              .append("        {\n")
              .append("          \"title\": \"Topic Title\",\n")
              .append("          \"description\": \"Description explaining what this topic covers.\",\n")
              .append("          \"suggestedDocUrl\": \"https://developer.mozilla.org/en-US/docs/Web/JavaScript\"\n")
              .append("        }\n")
              .append("      ]\n")
              .append("    }\n")
              .append("  ]\n")
              .append("}");

        return prompt.toString();
    }

    private GeminiPathResponse getFallbackPathResponse(String skill, String level, String goal, String studyHours, String learningStyle) {
        List<GeminiPathResponse.GeminiWeek> allWeeks = new java.util.ArrayList<>();
        String normalizedSkill = skill.trim().toLowerCase();

        // 1. Load the 8-week baseline for common skills
        if (normalizedSkill.contains("machine learning") || normalizedSkill.contains("ml")) {
            allWeeks.addAll(getMLFallbackWeeks());
        } else if (normalizedSkill.contains("react")) {
            allWeeks.addAll(getReactFallbackWeeks());
        } else if (normalizedSkill.contains("docker")) {
            allWeeks.addAll(getDockerFallbackWeeks());
        } else if (normalizedSkill.contains("kubernetes") || normalizedSkill.contains("k8s")) {
            allWeeks.addAll(getKubernetesFallbackWeeks());
        } else if (normalizedSkill.contains("python")) {
            allWeeks.addAll(getPythonFallbackWeeks());
        } else if (normalizedSkill.contains("java")) {
            allWeeks.addAll(getJavaFallbackWeeks());
        } else if (normalizedSkill.contains("sql") || normalizedSkill.contains("database")) {
            allWeeks.addAll(getSQLFallbackWeeks());
        } else if (normalizedSkill.contains("git") || normalizedSkill.contains("github")) {
            allWeeks.addAll(getGitFallbackWeeks());
        } else {
            // General baseline dynamic generator
            allWeeks.addAll(getGenericFallbackWeeks(skill));
        }

        // 2. Determine number of weeks based on level and study hours
        int numWeeks = 6;
        String normalizedLevel = (level != null) ? level.trim().toLowerCase() : "intermediate";
        String normalizedHours = (studyHours != null) ? studyHours.trim().toLowerCase() : "";

        if (normalizedLevel.contains("begin") || normalizedHours.contains("1-3") || normalizedHours.contains("1-5") || normalizedHours.contains("2-3")) {
            numWeeks = 4;
        } else if (normalizedLevel.contains("adv") || normalizedHours.contains("20+") || normalizedHours.contains("30") || normalizedHours.contains("40") || normalizedHours.contains("full-time")) {
            numWeeks = 8;
        }

        // Cap to the bounds of the list we generated
        numWeeks = Math.max(1, Math.min(numWeeks, allWeeks.size()));
        List<GeminiPathResponse.GeminiWeek> selectedWeeks = new java.util.ArrayList<>(allWeeks.subList(0, numWeeks));

        // 3. Apply style and goal customizations dynamically to make it highly personalized
        String normalizedStyle = (learningStyle != null) ? learningStyle.trim().toLowerCase() : "";
        String normalizedGoal = (goal != null) ? goal.trim().toLowerCase() : "";

        for (int i = 0; i < selectedWeeks.size(); i++) {
            GeminiPathResponse.GeminiWeek w = selectedWeeks.get(i);
            w.setWeekNumber(i + 1);

            List<String> objectives = new java.util.ArrayList<>(w.getObjectives());
            
            // Learning Style Customizations
            if (normalizedStyle.contains("practical") || normalizedStyle.contains("project")) {
                objectives.add("Hands-on Milestone: Build a mini-project applying this week's " + skill + " concepts.");
            } else if (normalizedStyle.contains("theory") || normalizedStyle.contains("academic")) {
                objectives.add("Architectural Focus: Summarize the theoretical principles and design constraints of this week's topics.");
            } else if (normalizedStyle.contains("document") || normalizedStyle.contains("reference")) {
                objectives.add("Documentation Study: Deep dive into the official API references and specifications for this week.");
            }

            // Goal Customizations
            if (normalizedGoal.contains("interview")) {
                objectives.add("Interview Drill: Practice explaining this week's concepts clearly and answering common technical questions.");
            } else if (normalizedGoal.contains("side project")) {
                objectives.add("Project Integration: Implement and test this week's features inside your master application.");
            }

            w.setObjectives(objectives);

            // Customize topic descriptions and doc URLs based on preferences
            for (GeminiPathResponse.GeminiTopic t : w.getTopics()) {
                String desc = t.getDescription();
                if (normalizedStyle.contains("practical") || normalizedStyle.contains("project")) {
                    desc += " Practical focus: write and deploy real code to verify this functionality.";
                } else if (normalizedStyle.contains("theory") || normalizedStyle.contains("academic")) {
                    desc += " Theoretical focus: study the design trade-offs and underlying architecture.";
                }
                if (normalizedGoal.contains("interview")) {
                    desc += " Be ready to white-board and troubleshoot this concept in technical interview rounds.";
                }
                t.setDescription(desc);
            }
        }

        return new GeminiPathResponse(selectedWeeks);
    }

    private List<GeminiPathResponse.GeminiWeek> getDockerFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Introduction to Docker & Containers", 
            List.of("Understand containerization vs virtualization", "Install and verify Docker setup", "Run and inspect standard public containers"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Containers vs Virtual Machines", "Understanding kernel virtualization, namespaces, cgroups, and container portability.", "https://docs.docker.com/get-started/overview/"),
                new GeminiPathResponse.GeminiTopic("Docker Engine Architecture", "Exploring the Docker daemon, REST API, client-server model, and runc/containerd runtimes.", "https://docs.docker.com/engine/"),
                new GeminiPathResponse.GeminiTopic("Essential CLI Operations", "Commands for managing containers, container lifecycles (run, stop, rm, ps, inspect).", "https://docs.docker.com/engine/reference/commandline/cli/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Creating Custom Images with Dockerfiles", 
            List.of("Understand image layers and caching", "Build and tag custom images", "Write efficient, clean Dockerfiles"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Dockerfile Instructions", "Using FROM, RUN, COPY, EXPOSE, CMD, ENTRYPOINT, and ENV instructions.", "https://docs.docker.com/engine/reference/builder/"),
                new GeminiPathResponse.GeminiTopic("Layer Caching & Multi-Stage Builds", "Optimizing image size and build times by leveraging caching and multi-stage builds.", "https://docs.docker.com/build/building/multi-stage/"),
                new GeminiPathResponse.GeminiTopic("Docker Registry & Tagging", "Pushing and pulling images from Docker Hub or private registries and using tags.", "https://docs.docker.com/engine/reference/commandline/image/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Multi-Container Orchestration with Docker Compose", 
            List.of("Define multi-container configurations", "Manage service dependencies", "Configure environment variables"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Compose File Structure", "Understanding YAML structure, services, networks, and volume definitions.", "https://docs.docker.com/compose/compose-file/"),
                new GeminiPathResponse.GeminiTopic("Docker Compose CLI", "Running docker compose up, down, build, logs, and exec.", "https://docs.docker.com/compose/reference/"),
                new GeminiPathResponse.GeminiTopic("Service Dependencies", "Configuring service startup orders and health checks using depends_on.", "https://docs.docker.com/compose/compose-file/05-services/#depends_on")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Data Persistence & Volumes", 
            List.of("Understand Docker storage drivers", "Create and mount volumes", "Use bind mounts for development"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Volumes vs Bind Mounts", "Choosing between managed volumes (isolated) and host-dependent bind mounts.", "https://docs.docker.com/storage/volumes/"),
                new GeminiPathResponse.GeminiTopic("Tmpfs Mounts", "Mounting temporary memory-only storage for security and speed.", "https://docs.docker.com/storage/tmpfs/"),
                new GeminiPathResponse.GeminiTopic("Volume Plugins & Shared Storage", "Using cloud volume drivers or local volume shares across multiple containers.", "https://docs.docker.com/storage/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Docker Networking and Communication", 
            List.of("Understand default networking drivers", "Create custom user-defined networks", "Expose ports and connect services"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Network Drivers", "Analyzing Bridge, Host, Overlay, Macvlan, and None drivers.", "https://docs.docker.com/network/"),
                new GeminiPathResponse.GeminiTopic("User-Defined Networks", "Creating isolated bridge networks for safe container-to-container DNS resolution.", "https://docs.docker.com/network/bridge/"),
                new GeminiPathResponse.GeminiTopic("Port Mapping & Publishing", "Exposing ports to the host interface and managing container network configurations.", "https://docs.docker.com/config/containers/container-network/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Security Best Practices & Optimization", 
            List.of("Run secure containers", "Configure resource quotas", "Analyze image vulnerabilities"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Non-Root Container Execution", "Configuring user IDs in Dockerfiles to prevent root exploit attacks.", "https://docs.docker.com/engine/security/userns-remap/"),
                new GeminiPathResponse.GeminiTopic("CPU & Memory Allocation Limits", "Setting CPU shares, limits, and memory reservations to prevent container resource exhaustion.", "https://docs.docker.com/config/containers/resource_constraints/"),
                new GeminiPathResponse.GeminiTopic("Docker Secret Management", "Injecting sensitive passwords and API keys securely using secrets rather than environment variables.", "https://docs.docker.com/engine/swarm/secrets/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "CI/CD Automation & Production Deployments", 
            List.of("Automate container builds", "Set up container registry integration", "Write health check probes"),
            List.of(
                new GeminiPathResponse.GeminiTopic("CI/CD Pipeline Integration", "Building, testing, and automatically pushing Docker images using GitHub Actions or GitLab CI.", "https://docs.docker.com/build/ci/"),
                new GeminiPathResponse.GeminiTopic("Healthchecks in Production", "Defining HEALTHCHECK parameters to allow automatic repair of unhealthy containers.", "https://docs.docker.com/engine/reference/builder/#healthcheck"),
                new GeminiPathResponse.GeminiTopic("Docker Logging Drivers", "Configuring json-file, journald, or syslog logging for robust server diagnostics.", "https://docs.docker.com/config/containers/logging/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Scaling Curriculums & Orchestration Intro", 
            List.of("Initialize Docker Swarm", "Manage swarm services", "Understand transition to Kubernetes"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Docker Swarm Mode", "Deploying stacks and scaling replica counts across clustered hosts.", "https://docs.docker.com/engine/swarm/key-concepts/"),
                new GeminiPathResponse.GeminiTopic("Swarm Routing Mesh", "Understanding load balancing and dynamic port routing inside Swarm.", "https://docs.docker.com/engine/swarm/ingress/"),
                new GeminiPathResponse.GeminiTopic("Transitioning to Kubernetes", "Comparing Swarm simplicity to K8s enterprise features.", "https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getKubernetesFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Kubernetes Core Concepts & Architecture",
            List.of("Understand declarative management", "Explore control plane components", "Run a basic pod"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Kubernetes Architecture", "Understanding the role of API Server, etcd, scheduler, controller manager, and Kubelet.", "https://kubernetes.io/docs/concepts/overview/"),
                new GeminiPathResponse.GeminiTopic("Pods & Pod Lifecycle", "Creating, managing, and inspecting Pods, the smallest deployable units.", "https://kubernetes.io/docs/concepts/workloads/pods/"),
                new GeminiPathResponse.GeminiTopic("kubectl CLI Operations", "Commands for managing cluster objects (get, describe, logs, apply, delete).", "https://kubernetes.io/docs/reference/kubectl/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Deployments and Scaling Applications",
            List.of("Manage application scaling", "Understand ReplicaSets", "Perform rolling updates"),
            List.of(
                new GeminiPathResponse.GeminiTopic("ReplicaSets & Scaling", "Ensuring a specified number of pod replicas are running at any given time.", "https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/"),
                new GeminiPathResponse.GeminiTopic("Deployments & Rolling Updates", "Managing declarative updates for Pods and ReplicaSets with zero downtime.", "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"),
                new GeminiPathResponse.GeminiTopic("Rollbacks & History", "Checking rollout history and rolling back to previous stable revisions.", "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Networking & Service Discovery",
            List.of("Expose pods to networks", "Understand ClusterIP and NodePort", "Configure DNS resolution"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Services Overview", "Routing traffic to dynamic pod IPs using stable service endpoints.", "https://kubernetes.io/docs/concepts/services-networking/service/"),
                new GeminiPathResponse.GeminiTopic("ClusterIP vs NodePort vs LoadBalancer", "Understanding internal, host-port, and cloud-integrated ingress networking.", "https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types"),
                new GeminiPathResponse.GeminiTopic("CoreDNS in Kubernetes", "How Kubernetes resolves service names to IPs dynamically inside namespaces.", "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Configuration (ConfigMaps & Secrets)",
            List.of("Decouple config from code", "Inject secrets securely", "Manage environment variables"),
            List.of(
                new GeminiPathResponse.GeminiTopic("ConfigMaps", "Storing non-confidential configuration data as key-value pairs.", "https://kubernetes.io/docs/concepts/configuration/configmap/"),
                new GeminiPathResponse.GeminiTopic("Secrets management", "Injecting database passwords and SSH keys securely via base64 objects.", "https://kubernetes.io/docs/concepts/configuration/secret/"),
                new GeminiPathResponse.GeminiTopic("Config Injection Methods", "Mounting ConfigMaps and Secrets as environment variables or volume files.", "https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Storage & Persistent Volumes",
            List.of("Understand storage lifecycle", "Create PersistentVolumes", "Mount persistent disks to pods"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Persistent Volumes & Claims", "Abstracting storage provisioning from storage consumption.", "https://kubernetes.io/docs/concepts/storage/persistent-volumes/"),
                new GeminiPathResponse.GeminiTopic("StorageClasses & Dynamic Provisioning", "Configuring on-demand volume allocation from cloud infrastructure.", "https://kubernetes.io/docs/concepts/storage/storage-classes/"),
                new GeminiPathResponse.GeminiTopic("Volume Mounts inside Containers", "Configuring mountPaths in pod templates for persistent database writes.", "https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Ingress Controllers & Traffic Routing",
            List.of("Expose multiple services via HTTP", "Set up reverse-proxy ingress rules", "Configure TLS termination"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Ingress Resources", "Defining rules for external HTTP/HTTPS routing to internal services.", "https://kubernetes.io/docs/concepts/services-networking/ingress/"),
                new GeminiPathResponse.GeminiTopic("Nginx Ingress Controller", "Deploying and configuring an Nginx-backed ingress gateway.", "https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/"),
                new GeminiPathResponse.GeminiTopic("TLS/SSL Termination", "Configuring certificate secrets to secure external API endpoints.", "https://kubernetes.io/docs/concepts/services-networking/ingress/#tls")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Helm & Package Management",
            List.of("Understand Helm chart structure", "Install pre-packaged applications", "Write custom templates"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Helm Architecture & Charts", "Managing K8s resource bundles using Helm packaging.", "https://helm.sh/docs/topics/charts/"),
                new GeminiPathResponse.GeminiTopic("Helm Release Commands", "Deploying, upgrading, and rolling back releases using helm upgrade.", "https://helm.sh/docs/intro/using_helm/"),
                new GeminiPathResponse.GeminiTopic("Values Customization", "Overriding default values in chart templates to configure instances.", "https://helm.sh/docs/chart_template_guide/values_files/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Cluster Monitoring & Security Hardening",
            List.of("Deploy monitoring stacks", "Configure cluster authorization", "Understand security contexts"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Prometheus & Grafana Setup", "Scraping cluster metrics and visualizing node CPU and pod memory stats.", "https://kubernetes.io/docs/tasks/debug/"),
                new GeminiPathResponse.GeminiTopic("Role-Based Access Control (RBAC)", "Configuring Roles, ClusterRoles, RoleBindings, and ServiceAccounts.", "https://kubernetes.io/docs/reference/access-authn-authz/rbac/"),
                new GeminiPathResponse.GeminiTopic("Network Policies", "Writing firewall rules to restrict traffic flows between namespace pods.", "https://kubernetes.io/docs/concepts/services-networking/network-policies/")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getReactFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "React Core Concepts & JSX",
            List.of("Understand React Virtual DOM", "Write JSX markup code", "Build functional components"),
            List.of(
                new GeminiPathResponse.GeminiTopic("JSX & Rendering", "Writing HTML-like code inside JavaScript and how React renders elements.", "https://react.dev/learn/writing-markup-with-jsx"),
                new GeminiPathResponse.GeminiTopic("Components & Props", "Functional components, custom props, and passing data down the tree.", "https://react.dev/learn/passing-props-to-a-component"),
                new GeminiPathResponse.GeminiTopic("List Rendering & Keys", "Iterating over data arrays using map and assigning unique keys.", "https://react.dev/learn/rendering-lists")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "State Management & React Hooks",
            List.of("Master useState hook", "Master useEffect hook", "Understand render cycles"),
            List.of(
                new GeminiPathResponse.GeminiTopic("useState Hook", "Managing local component state and triggering re-renders dynamically.", "https://react.dev/reference/react/useState"),
                new GeminiPathResponse.GeminiTopic("useEffect Hook", "Handling side effects like API fetching, subscriptions, and DOM updates.", "https://react.dev/reference/react/useEffect"),
                new GeminiPathResponse.GeminiTopic("Hook Dependencies", "Managing dependencies arrays to control hook trigger timing.", "https://react.dev/reference/react/useEffect#controlling-reactive-dependencies")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "React Routing & Dynamic Navigation",
            List.of("Configure React Router", "Manage URL parameters", "Build navigation links"),
            List.of(
                new GeminiPathResponse.GeminiTopic("React Router Setup", "Configuring paths, route structures, and browser routers.", "https://reactrouter.com/en/main/start/tutorial"),
                new GeminiPathResponse.GeminiTopic("Dynamic Routes & params", "Using useParams to load dynamic detail IDs and update views.", "https://reactrouter.com/en/main/route/route#path"),
                new GeminiPathResponse.GeminiTopic("Programmatic Navigation", "Navigating routes using useNavigate hooks based on user actions.", "https://reactrouter.com/en/main/hooks/use-navigate")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Global State and Context API",
            List.of("Prevent prop drilling", "Share state using Context API", "Consume shared provider values"),
            List.of(
                new GeminiPathResponse.GeminiTopic("React Context Creation", "Instantiating createContext for global state stores.", "https://react.dev/reference/react/createContext"),
                new GeminiPathResponse.GeminiTopic("Context Providers", "Wrapping app components in Context Providers to deliver global data.", "https://react.dev/reference/react/useContext"),
                new GeminiPathResponse.GeminiTopic("useContext Consumption", "Accessing global contexts from deep nested children without props.", "https://react.dev/reference/react/useContext#usecontext")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Advanced Hooks & Performance Tuning",
            List.of("Master component memoization", "Control callback references", "Manage local DOM elements"),
            List.of(
                new GeminiPathResponse.GeminiTopic("useMemo Hook", "Caching expensive calculations across re-renders.", "https://react.dev/reference/react/useMemo"),
                new GeminiPathResponse.GeminiTopic("useCallback Hook", "Caching callback function definitions to prevent child render spam.", "https://react.dev/reference/react/useCallback"),
                new GeminiPathResponse.GeminiTopic("useRef Hook", "Referencing values without triggering renders, and targeting DOM nodes.", "https://react.dev/reference/react/useRef")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Global Stores (Zustand & Redux)",
            List.of("Understand external stores", "Create a Zustand state store", "Manage states asynchronously"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Zustand State Store", "Setting up a lightweight, robust external state store for React.", "https://zustand-demo.pmnd.rs/"),
                new GeminiPathResponse.GeminiTopic("Redux Toolkit Integration", "Managing complex state via slices, dispatch actions, and reducers.", "https://redux-toolkit.js.org/"),
                new GeminiPathResponse.GeminiTopic("Async Actions in Stores", "Handling API requests inside stores and updating states asynchronously.", "https://zustand-demo.pmnd.rs/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Enterprise Fetching (React Query)",
            List.of("Configure caching queries", "Handle mutations and refreshes", "Manage load state flags"),
            List.of(
                new GeminiPathResponse.GeminiTopic("TanStack Query Basics", "Setting up QueryClientProviders and fetching data using useQuery.", "https://tanstack.com/query/latest/docs/framework/react/overview"),
                new GeminiPathResponse.GeminiTopic("Query Cache invalidation", "Refreshing query caches automatically using invalidateQueries.", "https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation"),
                new GeminiPathResponse.GeminiTopic("Mutations & Optimistic UI", "Posting data using useMutation and doing optimistic UI refreshes.", "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Testing & Deploying React Apps",
            List.of("Write component unit tests", "Simulate user click events", "Deploy production build bundles"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Jest & React Testing Library", "Writing unit test cases for rendering and validating components.", "https://testing-library.com/docs/react-testing-library/intro/"),
                new GeminiPathResponse.GeminiTopic("Simulating User Events", "Mocking text inputs and click triggers to verify component state.", "https://testing-library.com/docs/dom-testing-library/api-events/"),
                new GeminiPathResponse.GeminiTopic("Build Optimization & Vercel", "Building optimized bundles (npm run build) and deploying to static CDNs.", "https://vitejs.dev/guide/static-deploy.html")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getMLFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Fundamentals of Python & NumPy for ML",
            List.of("Master NumPy array calculations", "Analyze data in Pandas DataFrames", "Plot data visualizations"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Linear Algebra & NumPy Basics", "Matrix multiplications, dot products, and vectorized operations.", "https://numpy.org/doc/"),
                new GeminiPathResponse.GeminiTopic("Pandas Data Operations", "Filtering, grouping, merging, and cleaning data tables in DataFrames.", "https://pandas.pydata.org/docs/"),
                new GeminiPathResponse.GeminiTopic("Calculus & Gradient Descent", "Derivatives, gradients, and optimization foundations for learning.", "https://en.wikipedia.org/wiki/Gradient_descent")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Supervised Learning Algorithms",
            List.of("Implement linear regressions", "Understand decision tree classifications", "Learn scikit-learn APIs"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Regression Techniques", "Fitting lines, cost functions, MSE, and gradient descent updates.", "https://scikit-learn.org/stable/modules/linear_model.html"),
                new GeminiPathResponse.GeminiTopic("Classification Models", "Logistic regression, support vector machines, and Decision Trees.", "https://scikit-learn.org/stable/modules/tree.html"),
                new GeminiPathResponse.GeminiTopic("Ensemble Methods", "Combining predictors using Random Forests and Gradient Boosted Trees (XGBoost).", "https://scikit-learn.org/stable/modules/ensemble.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Model Evaluation & Hyperparameter Tuning",
            List.of("Calculate model score indicators", "Configure cross-validation checks", "Tune hyperparameter grids"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Performance Metrics", "Using Precision, Recall, F1-Score, and ROC-AUC curves for model checks.", "https://scikit-learn.org/stable/modules/model_evaluation.html"),
                new GeminiPathResponse.GeminiTopic("Cross-Validation Strategies", "Splitting datasets using K-Fold to prevent model overfitting.", "https://scikit-learn.org/stable/modules/cross_validation.html"),
                new GeminiPathResponse.GeminiTopic("Grid & Randomized Searches", "Automating hyperparameter search grids using GridSearchCV.", "https://scikit-learn.org/stable/modules/grid_search.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Unsupervised Learning & Clustering",
            List.of("Group data using K-Means", "Reduce dimensions using PCA", "Analyze clustering scores"),
            List.of(
                new GeminiPathResponse.GeminiTopic("K-Means & Hierarchical Clustering", "Unsupervised clustering algorithms and choosing optimal k parameters.", "https://scikit-learn.org/stable/modules/clustering.html"),
                new GeminiPathResponse.GeminiTopic("Principal Component Analysis (PCA)", "Compressing feature dimensions while preserving variance.", "https://en.wikipedia.org/wiki/Principal_component_analysis"),
                new GeminiPathResponse.GeminiTopic("Anomaly Detection", "Identifying outlier data points using Isolation Forests.", "https://scikit-learn.org/stable/modules/outlier_detection.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Deep Learning & Neural Networks",
            List.of("Understand artificial neuron nodes", "Implement Multi-Layer Perceptrons", "Apply backpropagation calculations"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Neural Network Architecture", "Input, hidden, output layers, weight metrics, and activation functions (ReLU, Sigmoid).", "https://en.wikipedia.org/wiki/Artificial_neural_network"),
                new GeminiPathResponse.GeminiTopic("Backpropagation & Optimization", "Loss functions, gradient calculations, and learning rate weights updates.", "https://en.wikipedia.org/wiki/Backpropagation"),
                new GeminiPathResponse.GeminiTopic("PyTorch Fundamentals", "Building tensors, configuring model classes, and tracking loss loops in PyTorch.", "https://pytorch.org/docs/stable/index.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Computer Vision (CNNs)",
            List.of("Understand convolution steps", "Train image classifier models", "Implement pooling layers"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Convolution Operations", "Applying image filters, kernels, and strides to extract features.", "https://en.wikipedia.org/wiki/Convolutional_neural_network"),
                new GeminiPathResponse.GeminiTopic("CNN Architectures", "Pooling, flatten layers, dense layers, and standard networks (ResNet).", "https://pytorch.org/vision/stable/models.html"),
                new GeminiPathResponse.GeminiTopic("Data Augmentation", "Resizing, rotating, and normalizing image inputs to improve model generalize.", "https://pytorch.org/vision/stable/transforms.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Natural Language Processing (RNNs & Transformers)",
            List.of("Tokenize text documents", "Understand recurrent neural cells", "Build seq2seq translation frameworks"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Text Embeddings & RNNs", "Word2Vec, tokenization, recurrent states, LSTMs, and handling sequences.", "https://en.wikipedia.org/wiki/Long_short-term_memory"),
                new GeminiPathResponse.GeminiTopic("Attention Mechanisms & Transformers", "Encoder-decoder models, self-attention, and Transformer block architecture.", "https://huggingface.co/docs/transformers/index"),
                new GeminiPathResponse.GeminiTopic("Hugging Face APIs", "Loading pre-trained language models (BERT, GPT) for text classification.", "https://huggingface.co/docs/transformers/quickstart")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "MLOps & Deploying Models",
            List.of("Serialize model variables", "Deploy models inside APIs", "Dockerize model services"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Model Serialization", "Saving scikit-learn models using joblib and PyTorch models using state_dict.", "https://scikit-learn.org/stable/model_persistence.html"),
                new GeminiPathResponse.GeminiTopic("FastAPI Serving", "Exposing prediction endpoints by wrapping models inside FastAPI controllers.", "https://fastapi.tiangolo.com/"),
                new GeminiPathResponse.GeminiTopic("Containerizing ML Apps", "Dockerizing prediction containers to ensure server deployments portability.", "https://docs.docker.com/get-started/")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getPythonFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Python Syntax & Basic Data Structures",
            List.of("Understand basic variable scopes", "Manipulate lists and dictionary maps", "Read and write disk files"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Control Flow & Variables", "If statements, loops, lists, dictionaries, tuples, and function arguments.", "https://docs.python.org/3/tutorial/index.html"),
                new GeminiPathResponse.GeminiTopic("File I/O operations", "Open, read, write, and close files safely using context managers (with statement).", "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files"),
                new GeminiPathResponse.GeminiTopic("Error & Exception Handling", "Using try, except, finally blocks to write crash-proof logic.", "https://docs.python.org/3/tutorial/errors.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Functional Programming & Iterators",
            List.of("Write list comprehensions", "Build generator loops", "Implement map/filter/reduce calls"),
            List.of(
                new GeminiPathResponse.GeminiTopic("List & Dict Comprehensions", "Synthesizing new data collections in a single line of code.", "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions"),
                new GeminiPathResponse.GeminiTopic("Generators & yield", "Creating memory-efficient lazy iterators using the yield statement.", "https://docs.python.org/3/howto/functional.html#generators"),
                new GeminiPathResponse.GeminiTopic("Built-in Itertools", "Using zip, enumerate, map, filter, and itertools modules.", "https://docs.python.org/3/library/itertools.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Object-Oriented Programming (OOP)",
            List.of("Create custom classes", "Implement inheritance trees", "Write dunder magic methods"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Classes & Encapsulation", "Declaring classes, properties, constructors (__init__), and private variables.", "https://docs.python.org/3/tutorial/classes.html"),
                new GeminiPathResponse.GeminiTopic("Inheritance & Polymorphism", "Overriding parent methods and establishing hierarchical class patterns.", "https://docs.python.org/3/tutorial/classes.html#inheritance"),
                new GeminiPathResponse.GeminiTopic("Magic Dunder Methods", "Overloading operators and configuring built-in behaviours (__str__, __repr__, __add__).", "https://docs.python.org/3/reference/datamodel.html#specialnames")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Packaging & Environment Setup",
            List.of("Configure virtual environments", "Manage dependencies with pip", "Build importing namespaces"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Virtual Environments", "Isolating project packages using venv and configuration files.", "https://docs.python.org/3/library/venv.html"),
                new GeminiPathResponse.GeminiTopic("Pip & Requirements", "Specifying dependencies inside requirements.txt or pyproject.toml.", "https://pip.pypa.io/en/stable/"),
                new GeminiPathResponse.GeminiTopic("Python Modules & Imports", "Organizing source code files across nested folder packages.", "https://docs.python.org/3/tutorial/modules.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Scraping Web Data & API Consumptions",
            List.of("Fetch web HTTP data", "Parse HTML files using BeautifulSoup", "Read API JSON responses"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Requests Package", "Issuing HTTP GET and POST requests and configuring query params.", "https://docs.python-requests.org/"),
                new GeminiPathResponse.GeminiTopic("BeautifulSoup Web Scraping", "Parsing web pages and extracting specific DOM nodes.", "https://www.crummy.com/software/BeautifulSoup/bs4/doc/"),
                new GeminiPathResponse.GeminiTopic("JSON parsing", "Transforming string responses into native Python dictionary structures.", "https://docs.python.org/3/library/json.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Database Mappings & ORMs (SQLAlchemy)",
            List.of("Connect databases via sqlite3", "Define SQLAlchemy model classes", "Perform SQL data queries"),
            List.of(
                new GeminiPathResponse.GeminiTopic("SQLite Database API", "Interacting with lightweight databases using native SQL scripts.", "https://docs.python.org/3/library/sqlite3.html"),
                new GeminiPathResponse.GeminiTopic("SQLAlchemy ORM Mapping", "Configuring database tables as Python class models.", "https://www.sqlalchemy.org/"),
                new GeminiPathResponse.GeminiTopic("ORM Query operations", "Performing data writes, updates, and filtering joins via SQLAlchemy sessions.", "https://docs.sqlalchemy.org/en/20/orm/quickstart.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Web APIs (FastAPI & Flask)",
            List.of("Build web route endpoints", "Receive JSON request parameters", "Return API JSON models"),
            List.of(
                new GeminiPathResponse.GeminiTopic("FastAPI Framework Basics", "Creating API routers, endpoints, and automatic Swagger docs.", "https://fastapi.tiangolo.com/"),
                new GeminiPathResponse.GeminiTopic("Pydantic Validation Models", "Enforcing request schema checks using Pydantic classes.", "https://docs.pydantic.dev/"),
                new GeminiPathResponse.GeminiTopic("Flask Framework Basics", "Configuring Flask routes and rendering dynamic HTML templates.", "https://flask.palletsprojects.com/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Unit Testing & Coding Standards",
            List.of("Write tests in pytest", "Apply black linter formats", "Identify type warning hints"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Pytest Framework", "Writing assertions and grouping test cases into execution suites.", "https://docs.pytest.org/"),
                new GeminiPathResponse.GeminiTopic("Flake8 & Black Formatting", "Enforcing PEP 8 styling conventions automatically.", "https://black.readthedocs.io/"),
                new GeminiPathResponse.GeminiTopic("Python Type Hinting", "Adding static types to function arguments to prevent bugs.", "https://docs.python.org/3/library/typing.html")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getJavaFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Java Basics & JVM Architecture",
            List.of("Understand Java compilation", "Manage basic control flows", "Write simple array scripts"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Java Compilation & JVM", "How javac compiles source files to bytecode and JVM runs it.", "https://docs.oracle.com/en/java/"),
                new GeminiPathResponse.GeminiTopic("Basic Syntax & Loops", "Variables, static types, conditional logic, and looping structures.", "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/"),
                new GeminiPathResponse.GeminiTopic("Java Primitive Arrays", "Creating and iterating primitive structures.", "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Object-Oriented Programming (OOP) in Java",
            List.of("Create encapsulation packages", "Implement polymorphism methods", "Declare abstract interface types"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Classes & Constructors", "Instantiating objects and defining private properties.", "https://docs.oracle.com/javase/tutorial/java/javaOO/"),
                new GeminiPathResponse.GeminiTopic("Inheritance & Interfaces", "Reusing code features using extends and implements keys.", "https://docs.oracle.com/javase/tutorial/java/IandI/index.html"),
                new GeminiPathResponse.GeminiTopic("Abstract Classes & Polymorphism", "Overloading methods and working with dynamic runtime types.", "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Java Collections & Generic Types",
            List.of("Work with List arrays", "Utilize Map dictionary pairs", "Configure generic classes"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Java List & Set Collections", "Differences between ArrayList, LinkedList, HashSet, and TreeSet.", "https://docs.oracle.com/javase/tutorial/collections/"),
                new GeminiPathResponse.GeminiTopic("Map interface structures", "Using HashMap and TreeMap to link keys and values.", "https://docs.oracle.com/javase/tutorial/collections/interfaces/map.html"),
                new GeminiPathResponse.GeminiTopic("Java Generics", "Defining classes with type parameter placeholders to prevent cast errors.", "https://docs.oracle.com/javase/tutorial/java/generics/index.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Exceptions & Stream IO Operations",
            List.of("Write try-catch handlers", "Implement auto-close resources", "Read disk bytes stream files"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Checked vs Unchecked exceptions", "Throwing exceptions and designing custom exception classes.", "https://docs.oracle.com/javase/tutorial/essential/exceptions/"),
                new GeminiPathResponse.GeminiTopic("Try-With-Resources Syntax", "Managing auto-close file and database connections.", "https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html"),
                new GeminiPathResponse.GeminiTopic("Java File IO streams", "Reading and writing files using BufferedReader and FileWriter classes.", "https://docs.oracle.com/javase/tutorial/essential/io/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Java Lambda & Streams API",
            List.of("Write functional lambda expressions", "Apply filter stream chains", "Collect data lists"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Functional Interfaces", "Declaring functions using @FunctionalInterface annotations and lambda shortcuts.", "https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html"),
                new GeminiPathResponse.GeminiTopic("Java Streams operations", "Chaining filter, map, flatMap, and sorted stream methods.", "https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html"),
                new GeminiPathResponse.GeminiTopic("Stream Collectors", "Compiling terminal outcomes into Lists, Sets, or Maps using Collectors.", "https://docs.oracle.com/javase/8/docs/api/java/util/stream/Collectors.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Multithreading & Concurrency",
            List.of("Launch background Threads", "Synchronize memory access blocks", "Configure Executor service workers"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Runnable & Thread creation", "Spawning background threads and understanding thread lifecycles.", "https://docs.oracle.com/javase/tutorial/essential/concurrency/runthread.html"),
                new GeminiPathResponse.GeminiTopic("Thread Synchronization", "Handling race conditions and lock blocks using synchronized keywords.", "https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html"),
                new GeminiPathResponse.GeminiTopic("Executors & Thread Pools", "Reusing worker threads dynamically using ThreadPoolExecutors.", "https://docs.oracle.com/javase/tutorial/essential/concurrency/pools.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Database Integrations (JDBC & JPA)",
            List.of("Connect databases via JDBC", "Configure JPA Hibernate entities", "Write JPQL entity queries"),
            List.of(
                new GeminiPathResponse.GeminiTopic("JDBC DB Connections", "Issuing manual SQL statements and reading ResultSets.", "https://docs.oracle.com/javase/tutorial/jdbc/"),
                new GeminiPathResponse.GeminiTopic("JPA Hibernate Entities", "Annotating class models with @Entity, @Id, and @ManyToOne links.", "https://spring.io/projects/spring-data-jpa"),
                new GeminiPathResponse.GeminiTopic("Spring Data JPA repositories", "Defining query interfaces and calling automatic JPA methods.", "https://spring.io/projects/spring-data-jpa")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Spring Boot web API Service",
            List.of("Configure Spring Boot configs", "Write RestController routers", "Inject dependency beans"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Spring Boot Setup", "Configuring application.properties and running Spring Boot apps.", "https://spring.io/guides/gs/rest-service/"),
                new GeminiPathResponse.GeminiTopic("Dependency Injection & Beans", "Using @Autowired, @Service, and @Component bean annotations.", "https://spring.io/guides/gs/actuator-service/"),
                new GeminiPathResponse.GeminiTopic("REST Controller API endpoints", "Mapping routing controllers using @GetMapping and @PostMapping annotations.", "https://spring.io/guides/tutorials/rest/")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getSQLFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "SQL Basics & Filtering",
            List.of("Write SQL SELECT statements", "Filter data using WHERE clauses", "Order outcomes via ORDER BY"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Relational DB Concepts", "Tables, rows, columns, data types, and primary keys.", "https://www.postgresql.org/docs/current/tutorial-sql.html"),
                new GeminiPathResponse.GeminiTopic("SELECT & WHERE Operations", "Extracting fields, applying conditions, and logical checks (AND, OR, NOT, IN, BETWEEN).", "https://www.postgresql.org/docs/current/queries-tableexpr.html"),
                new GeminiPathResponse.GeminiTopic("SQL Aggregate functions", "Counting, summing, and grouping entries using COUNT, SUM, AVG, GROUP BY, and HAVING.", "https://www.postgresql.org/docs/current/functions-aggregate.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Joins & Merging Data Tables",
            List.of("Merge data using Joins", "Distinguish Left/Right/Inner joins", "Resolve duplicate column issues"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Inner Joins", "Matching records across tables based on key equality.", "https://www.postgresql.org/docs/current/queries-join.html"),
                new GeminiPathResponse.GeminiTopic("Left, Right & Full Outer Joins", "Preserving unmatched entries in left, right, or both data sets.", "https://www.postgresql.org/docs/current/queries-join.html"),
                new GeminiPathResponse.GeminiTopic("Self Joins & Aliases", "Joining a table to itself and managing namespace aliases.", "https://www.postgresql.org/docs/current/queries-join.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Subqueries & Common Table Expressions (CTEs)",
            List.of("Nest queries inside SELECTs", "Define Common Table Expressions (WITH)", "Optimize nested query structures"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Subqueries in WHERE & FROM", "Executing subqueries to filter data dynamically.", "https://www.postgresql.org/docs/current/queries-subquery.html"),
                new GeminiPathResponse.GeminiTopic("Common Table Expressions (CTEs)", "Structuring complex scripts using readable WITH query blocks.", "https://www.postgresql.org/docs/current/queries-with.html"),
                new GeminiPathResponse.GeminiTopic("Correlated Subqueries", "Using outer query fields inside subquery parameters.", "https://www.postgresql.org/docs/current/queries-subquery.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Database Schema Design (DDL)",
            List.of("Create and alter tables", "Enforce key constraints", "Configure index references"),
            List.of(
                new GeminiPathResponse.GeminiTopic("CREATE & ALTER TABLE", "Creating table schemas and setting data types.", "https://www.postgresql.org/docs/current/sql-createtable.html"),
                new GeminiPathResponse.GeminiTopic("Key Constraints", "Enforcing PRIMARY KEY, FOREIGN KEY, UNIQUE, and NOT NULL checks.", "https://www.postgresql.org/docs/current/ddl-constraints.html"),
                new GeminiPathResponse.GeminiTopic("Data Modifiers (INSERT, UPDATE, DELETE)", "Executing DML statements and maintaining transaction safety.", "https://www.postgresql.org/docs/current/dml.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Indexes & Query Planning",
            List.of("Create B-tree indexes", "Analyze queries using EXPLAIN", "Optimize search paths"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Index Architectures", "B-tree, Hash, GiST, GIN index types and choosing keys.", "https://www.postgresql.org/docs/current/indexes.html"),
                new GeminiPathResponse.GeminiTopic("EXPLAIN Analysis", "Reading execution plans, detecting sequential scans, and checking indexes.", "https://www.postgresql.org/docs/current/using-explain.html"),
                new GeminiPathResponse.GeminiTopic("Query Optimizations", "Rewriting slow queries, avoiding SELECT *, and structuring Joins.", "https://www.postgresql.org/docs/current/performance-tips.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Database Transactions & Concurrency",
            List.of("Manage database transaction scopes", "Set isolation level parameters", "Solve concurrency conflicts"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Transaction Control (ACID)", "Atomicity, Consistency, Isolation, Durability rules, and using COMMIT/ROLLBACK.", "https://www.postgresql.org/docs/current/tutorial-transactions.html"),
                new GeminiPathResponse.GeminiTopic("Isolation Levels", "Read Committed, Repeatable Read, and Serializable configurations.", "https://www.postgresql.org/docs/current/transaction-iso.html"),
                new GeminiPathResponse.GeminiTopic("Locking Mechanisms", "Row-level locks, table-level locks, and handling deadlocks.", "https://www.postgresql.org/docs/current/explicit-locking.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Procedures, Triggers & Views",
            List.of("Write stored procedures", "Trigger database event scripts", "Create virtual Views"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Stored Procedures", "Writing reusable database routines in PL/pgSQL.", "https://www.postgresql.org/docs/current/sql-createprocedure.html"),
                new GeminiPathResponse.GeminiTopic("Database Triggers", "Configuring event listeners to execute scripts on update or insert.", "https://www.postgresql.org/docs/current/rules-triggers.html"),
                new GeminiPathResponse.GeminiTopic("Views & Materialized Views", "Saving queries as virtual tables and configuring cache materializations.", "https://www.postgresql.org/docs/current/rules-views.html")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Advanced SQL & Database Scaling",
            List.of("Write Window functions", "Understand sharding models", "Compare SQL vs NoSQL databases"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Window Functions", "Performing calculations across sets using ROW_NUMBER, RANK, and PARTITION BY.", "https://www.postgresql.org/docs/current/tutorial-window.html"),
                new GeminiPathResponse.GeminiTopic("Database Sharding & Replication", "Distributing tables across multiple clusters and setting up read replicas.", "https://en.wikipedia.org/wiki/Database_sharding"),
                new GeminiPathResponse.GeminiTopic("NoSQL Database Architectures", "Comparing relational databases with MongoDB, Redis, and Cassandra.", "https://en.wikipedia.org/wiki/NoSQL")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getGitFallbackWeeks() {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Git Basics & Version Control",
            List.of("Understand Git local states", "Commit files with message tags", "Inspect differences via git diff"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Local Repository Initialization", "Configuring Git variables, running git init, and git status.", "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control"),
                new GeminiPathResponse.GeminiTopic("Staging Area & Commits", "Adding changes using git add and recording checkpoints via git commit.", "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository"),
                new GeminiPathResponse.GeminiTopic("Inspecting History", "Reviewing commit logs using git log and checking diff modifications.", "https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Branching & Merging",
            List.of("Create custom branch lines", "Merge feature branches", "Resolve file merge conflicts"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Branch Management", "Creating, switching, and deleting branches (git branch, git checkout/switch).", "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell"),
                new GeminiPathResponse.GeminiTopic("Git Merge & Fast-Forward", "Combining commits from distinct branches and understanding fast-forward updates.", "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging"),
                new GeminiPathResponse.GeminiTopic("Conflict Resolutions", "Opening files with conflict markings and committing manual resolves.", "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Remote Collaboration & Pull Requests",
            List.of("Connect local repos to remotes", "Issue git pull and push", "Manage GitHub pull requests"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Remote Operations", "Configuring remote repository urls using git remote add.", "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes"),
                new GeminiPathResponse.GeminiTopic("Fetching vs Pulling", "Updating local references using git fetch and merging changes via git pull.", "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes#_fetching_and_pulling"),
                new GeminiPathResponse.GeminiTopic("GitHub Pull Request Workflow", "Forking, cloning, pushing branches, and opening pull requests.", "https://git-scm.com/book/en/v2/GitHub-Contributing-to-a-Project")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Rebasing & History Management",
            List.of("Understand merge vs rebase", "Perform git rebase updates", "Clean history using interactive squash"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Rebase Basics", "Reapplying commits on top of another base tip to keep history linear.", "https://git-scm.com/book/en/v2/Git-Branching-Rebasing"),
                new GeminiPathResponse.GeminiTopic("Interactive Rebasing", "Squashing, editing, and dropping historical commits using git rebase -i.", "https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History"),
                new GeminiPathResponse.GeminiTopic("Rebase Conflict Resolutions", "Resolving conflicts step-by-step during a rebase run.", "https://git-scm.com/book/en/v2/Git-Branching-Rebasing#_rebase_rebase")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Advanced Merging & Cherry-Picking",
            List.of("Copy specific commits via cherry-pick", "Revert specific commits", "Use advanced git log checks"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Cherry-Pick", "Applying the changes introduced by some existing commits onto the current branch.", "https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging"),
                new GeminiPathResponse.GeminiTopic("Git Revert & Reset", "Undoing commits safely using git revert (creates new commit) vs git reset.", "https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified"),
                new GeminiPathResponse.GeminiTopic("Reflog Troubleshooting", "Viewing the record of local tip changes using git reflog to recover lost commits.", "https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Stashing & Git Tagging",
            List.of("Save uncommitted changes dynamically", "Apply and pop stashes", "Configure version release tags"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Stash Operations", "Saving modified files in a local temporary stack (git stash, git stash pop).", "https://git-scm.com/book/en/v2/Git-Tools-Stashing-and-Cleaning"),
                new GeminiPathResponse.GeminiTopic("Release Tagging", "Annotating specific commits as version tags (git tag -a).", "https://git-scm.com/book/en/v2/Git-Basics-Tagging"),
                new GeminiPathResponse.GeminiTopic("Git Clean", "Pruning untracked files from the local directory safely.", "https://git-scm.com/book/en/v2/Git-Tools-Stashing-and-Cleaning#_cleaning_your_working_directory")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Git Hook Automation",
            List.of("Understand pre-commit events", "Write custom shell hooks", "Enforce lint checks before commits"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Hooks Overview", "Client-side and server-side hook event points.", "https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks"),
                new GeminiPathResponse.GeminiTopic("Writing pre-commit scripts", "Automating code compilation and test suite runs before commit approval.", "https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks#_client_side_hooks"),
                new GeminiPathResponse.GeminiTopic("Husky Setup for Node", "Configuring automated hook runners in web projects.", "https://typicode.github.io/husky/")
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "Git Internals & Recovery",
            List.of("Understand .git directories structure", "Analyze blob and tree objects", "Recover corrupted directories"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Git Objects Database", "How Git stores content inside blob, tree, commit, and tag objects.", "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects"),
                new GeminiPathResponse.GeminiTopic("Git References & Packfiles", "Understanding symbolic references (HEAD) and space compression (packfiles).", "https://git-scm.com/book/en/v2/Git-Internals-Git-References"),
                new GeminiPathResponse.GeminiTopic("Maintenance & Garbage Collection", "Pruning unreachable objects using git gc.", "https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery")
            )
        ));
        return weeks;
    }

    private List<GeminiPathResponse.GeminiWeek> getGenericFallbackWeeks(String skill) {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        String capitalizedSkill = skill.substring(0, 1).toUpperCase() + (skill.length() > 1 ? skill.substring(1) : "");
        
        weeks.add(new GeminiPathResponse.GeminiWeek(1, "Fundamentals of " + capitalizedSkill,
            List.of("Understand core terminology of " + skill, "Set up development tools and environments", "Write basic programs"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Introduction to " + capitalizedSkill, "Historical background, core use cases, and setup steps.", "https://en.wikipedia.org/wiki/" + capitalizedSkill.replace(" ", "_")),
                new GeminiPathResponse.GeminiTopic("Environment & Tooling Setup", "Installing SDKs, setting up code editors, and configuring local projects.", getGenericSuggestedDocUrl(skill, "Setup"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(2, "Core Mechanics & Key Concepts",
            List.of("Learn data flows and structures in " + skill, "Implement logic and conditional structures", "Build small practical features"),
            List.of(
                new GeminiPathResponse.GeminiTopic(capitalizedSkill + " Architecture", "Understanding compilation, runtime, and framework lifecycles.", getGenericSuggestedDocUrl(skill, "Architecture")),
                new GeminiPathResponse.GeminiTopic("Key APIs and Libraries", "Working with standard packages, utility methods, and default configurations.", getGenericSuggestedDocUrl(skill, "APIs"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(3, "Advanced Features & Integration",
            List.of("Connect " + skill + " to external database or API services", "Handle errors, exceptions, and security practices", "Manage state transitions"),
            List.of(
                new GeminiPathResponse.GeminiTopic("State & Data Operations", "Fetching, posting, and storing local state securely.", getGenericSuggestedDocUrl(skill, "State")),
                new GeminiPathResponse.GeminiTopic("Error Management & Best Practices", "Building resilient configurations, handling edge cases, and testing.", getGenericSuggestedDocUrl(skill, "Errors"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(4, "Project Implementation & Deployment",
            List.of("Build a full production-ready " + skill + " project", "Write unit and validation tests", "Deploy to cloud environments"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Final Project Assembly", "Integrating all concepts into a functional, portfolio-ready application.", getGenericSuggestedDocUrl(skill, "Project")),
                new GeminiPathResponse.GeminiTopic("Testing & Deployment", "Configuring CI/CD, writing test cases, and launching live servers.", getGenericSuggestedDocUrl(skill, "Deployment"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(5, "Performance Tuning & Optimization",
            List.of("Measure system bottleneck indices", "Configure caching and speed enhancements", "Profile resource usage"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Performance Profiling", "Analyzing computation speed and resolving common performance bottlenecks.", getGenericSuggestedDocUrl(skill, "Profiling")),
                new GeminiPathResponse.GeminiTopic("Optimization Strategies", "Implementing resource recycling, lazy-loading, and speed tweaks.", getGenericSuggestedDocUrl(skill, "Optimization"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(6, "Enterprise Scaling & Security",
            List.of("Implement enterprise authorization policies", "Build robust network protection schemes", "Configure logging aggregates"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Security Hardening", "Closing threat doors and applying least-privilege security access.", getGenericSuggestedDocUrl(skill, "Security")),
                new GeminiPathResponse.GeminiTopic("Log Aggregation & Monitoring", "Aggregating telemetry diagnostics for production monitoring.", getGenericSuggestedDocUrl(skill, "Monitoring"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(7, "Continuous Delivery & Pipelines",
            List.of("Write pipeline stage rules", "Configure automated package registry deliveries", "Implement rolling update logic"),
            List.of(
                new GeminiPathResponse.GeminiTopic("Infrastructure as Code & CI/CD", "Automating testing checks and code shipping in unified delivery runners.", getGenericSuggestedDocUrl(skill, "CI/CD")),
                new GeminiPathResponse.GeminiTopic("Deployment Rollout Orchestration", "Configuring canary tests and blue-green staging swaps.", getGenericSuggestedDocUrl(skill, "Rollouts"))
            )
        ));
        weeks.add(new GeminiPathResponse.GeminiWeek(8, "System Design & Expert Architecture",
            List.of("Design microservice blueprints", "Decouple dependency networks", "Write clean architecture modules"),
            List.of(
                new GeminiPathResponse.GeminiTopic("System Design Blueprints", "Constructing scalable enterprise layouts matching high traffic demand.", getGenericSuggestedDocUrl(skill, "Design")),
                new GeminiPathResponse.GeminiTopic("Refactoring & Legacy Migration", "Evolving historical architectures to modular modern standards.", getGenericSuggestedDocUrl(skill, "Refactoring"))
            )
        ));

        return weeks;
    }

    public String getDynamicDocUrl(String skill, String topicTitle) {
        String s = skill.toLowerCase().trim();
        String t = topicTitle.toLowerCase().trim();
        
        if (s.contains("docker")) {
            if (t.contains("compose")) return "https://docs.docker.com/compose/";
            if (t.contains("file") || t.contains("dockerfile")) return "https://docs.docker.com/engine/reference/builder/";
            if (t.contains("volume") || t.contains("storage")) return "https://docs.docker.com/storage/";
            if (t.contains("network")) return "https://docs.docker.com/network/";
            if (t.contains("security")) return "https://docs.docker.com/engine/security/";
            if (t.contains("swarm")) return "https://docs.docker.com/engine/swarm/";
            return "https://docs.docker.com/get-started/";
        } else if (s.contains("kubernetes") || s.contains("k8s")) {
            if (t.contains("pod")) return "https://kubernetes.io/docs/concepts/workloads/pods/";
            if (t.contains("deploy")) return "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/";
            if (t.contains("service")) return "https://kubernetes.io/docs/concepts/services-networking/service/";
            if (t.contains("ingress")) return "https://kubernetes.io/docs/concepts/services-networking/ingress/";
            if (t.contains("configmap") || t.contains("secret")) return "https://kubernetes.io/docs/concepts/configuration/";
            if (t.contains("volume") || t.contains("storage") || t.contains("pv")) return "https://kubernetes.io/docs/concepts/storage/";
            if (t.contains("helm")) return "https://helm.sh/docs/";
            return "https://kubernetes.io/docs/home/";
        } else if (s.contains("react")) {
            if (t.contains("hook") || t.contains("usestate") || t.contains("useeffect")) return "https://react.dev/reference/react";
            if (t.contains("router") || t.contains("route")) return "https://reactrouter.com/en/main";
            if (t.contains("context")) return "https://react.dev/reference/react/createContext";
            if (t.contains("redux") || t.contains("store") || t.contains("zustand")) return "https://redux-toolkit.js.org/";
            if (t.contains("query") || t.contains("fetch")) return "https://tanstack.com/query/latest";
            return "https://react.dev/learn";
        } else if (s.contains("python")) {
            if (t.contains("list") || t.contains("dict") || t.contains("tuple") || t.contains("data structure")) return "https://docs.python.org/3/tutorial/datastructures.html";
            if (t.contains("class") || t.contains("oop") || t.contains("object")) return "https://docs.python.org/3/tutorial/classes.html";
            if (t.contains("file") || t.contains("io")) return "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files";
            if (t.contains("exception") || t.contains("error")) return "https://docs.python.org/3/tutorial/errors.html";
            if (t.contains("virtual") || t.contains("venv") || t.contains("pip")) return "https://docs.python.org/3/library/venv.html";
            if (t.contains("fastapi")) return "https://fastapi.tiangolo.com/";
            if (t.contains("flask")) return "https://flask.palletsprojects.com/";
            if (t.contains("pytest") || t.contains("test")) return "https://docs.pytest.org/";
            return "https://docs.python.org/3/tutorial/";
        } else if (s.contains("java")) {
            if (t.contains("oop") || t.contains("class") || t.contains("interface")) return "https://docs.oracle.com/javase/tutorial/java/IandI/";
            if (t.contains("collection") || t.contains("list") || t.contains("map")) return "https://docs.oracle.com/javase/tutorial/collections/";
            if (t.contains("stream") || t.contains("lambda")) return "https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html";
            if (t.contains("concur") || t.contains("thread")) return "https://docs.oracle.com/javase/tutorial/essential/concurrency/";
            if (t.contains("spring") || t.contains("boot")) return "https://spring.io/projects/spring-boot";
            if (t.contains("jdbc") || t.contains("jpa") || t.contains("hibernate")) return "https://spring.io/projects/spring-data-jpa";
            return "https://docs.oracle.com/en/java/";
        } else if (s.contains("sql") || s.contains("database") || s.contains("postgres") || s.contains("mysql")) {
            if (t.contains("join")) return "https://www.postgresql.org/docs/current/queries-join.html";
            if (t.contains("cte") || t.contains("subquery") || t.contains("with")) return "https://www.postgresql.org/docs/current/queries-with.html";
            if (t.contains("index") || t.contains("explain")) return "https://www.postgresql.org/docs/current/indexes.html";
            if (t.contains("transaction") || t.contains("acid")) return "https://www.postgresql.org/docs/current/tutorial-transactions.html";
            if (t.contains("procedure") || t.contains("trigger") || t.contains("view")) return "https://www.postgresql.org/docs/current/rules-views.html";
            return "https://www.postgresql.org/docs/current/index.html";
        } else if (s.contains("git") || s.contains("github")) {
            if (t.contains("branch") || t.contains("merge")) return "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell";
            if (t.contains("remote") || t.contains("push") || t.contains("pull")) return "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes";
            if (t.contains("rebase") || t.contains("squash")) return "https://git-scm.com/book/en/v2/Git-Branching-Rebasing";
            if (t.contains("reset") || t.contains("revert") || t.contains("cherry-pick")) return "https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified";
            if (t.contains("stash") || t.contains("tag")) return "https://git-scm.com/book/en/v2/Git-Tools-Stashing-and-Cleaning";
            return "https://git-scm.com/doc";
        } else if (s.contains("machine learning") || s.contains("ml") || s.contains("deep learning")) {
            if (t.contains("numpy")) return "https://numpy.org/doc/";
            if (t.contains("pandas")) return "https://pandas.pydata.org/docs/";
            if (t.contains("scikit") || t.contains("regression") || t.contains("classification") || t.contains("cluster")) return "https://scikit-learn.org/stable/";
            if (t.contains("pytorch") || t.contains("neural") || t.contains("deep")) return "https://pytorch.org/docs/stable/index.html";
            if (t.contains("tensorflow")) return "https://www.tensorflow.org/api_docs";
            if (t.contains("hugging") || t.contains("transformer")) return "https://huggingface.co/docs";
            return "https://scikit-learn.org/stable/";
        } else if (s.contains("terraform")) {
            return "https://developer.hashicorp.com/terraform/docs";
        } else if (s.contains("ansible")) {
            return "https://docs.ansible.com/ansible/latest/index.html";
        } else if (s.contains("rust")) {
            return "https://doc.rust-lang.org/book/";
        } else if (s.contains("go") || s.equals("golang")) {
            return "https://go.dev/doc/";
        } else if (s.contains("aws") || s.contains("amazon")) {
            return "https://docs.aws.amazon.com/";
        } else if (s.contains("gcp") || s.contains("google-cloud")) {
            return "https://cloud.google.com/docs";
        } else if (s.contains("azure")) {
            return "https://learn.microsoft.com/en-us/azure/";
        } else if (s.contains("javascript") || s.contains("js") || s.contains("html") || s.contains("css")) {
            return "https://developer.mozilla.org/";
        } else if (s.contains("typescript") || s.contains("ts")) {
            return "https://www.typescriptlang.org/docs/";
        }
        
        return "https://en.wikipedia.org/wiki/" + skill.replace(" ", "_");
    }

    private String getGenericSuggestedDocUrl(String skill, String topicTitle) {
        return getDynamicDocUrl(skill, topicTitle);
    }

}

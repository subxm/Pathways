package com.pathways.pathservice.client;

import com.pathways.pathservice.model.Resource;
import com.pathways.pathservice.model.ResourceType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class YouTubeClient {

    private final WebClient webClient;
    private final String apiKey;

    public YouTubeClient(
            WebClient.Builder webClientBuilder,
            @Value("${youtube.apiKey}") String apiKey) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
    }

    @Async("resourceFetchExecutor")
    public CompletableFuture<List<Resource>> fetchVideos(String skill, String topicTitle) {
        String query = skill + " " + topicTitle + " tutorial";
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=" 
                + encodedQuery + "&type=video&key=" + apiKey;

        List<Resource> predefined = getPredefinedVideos(skill, topicTitle);
        if (!predefined.isEmpty()) {
            return CompletableFuture.completedFuture(predefined);
        }

        List<Resource> resources = new ArrayList<>();

        try {
            // Check if YouTube API key is configured
            if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${YOUTUBE_API_KEY}")) {
                throw new IllegalStateException("YouTube API key is missing or empty");
            }

            Map<?, ?> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("items")) {
                List<?> items = (List<?>) response.get("items");
                for (Object itemObj : items) {
                    Map<?, ?> item = (Map<?, ?>) itemObj;
                    Map<?, ?> idMap = (Map<?, ?>) item.get("id");
                    String videoId = (String) idMap.get("videoId");
                    
                    Map<?, ?> snippet = (Map<?, ?>) item.get("snippet");
                    String title = (String) snippet.get("title");
                    String description = (String) snippet.get("description");
                    
                    String thumbnailUrl = "";
                    Map<?, ?> thumbnails = (Map<?, ?>) snippet.get("thumbnails");
                    if (thumbnails != null) {
                        Map<?, ?> defaultThumb = (Map<?, ?>) thumbnails.get("default");
                        if (defaultThumb != null) {
                            thumbnailUrl = (String) defaultThumb.get("url");
                        }
                    }

                    resources.add(Resource.builder()
                            .type(ResourceType.YOUTUBE)
                            .title(title)
                            .url("https://www.youtube.com/watch?v=" + videoId)
                            .description(description)
                            .thumbnailUrl(thumbnailUrl)
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("YouTube API call failed for query '" + query + "'. Attempting search scraping fallback... Error: " + e.getMessage());
            try {
                // Fetch search results HTML from YouTube using Java's native HttpClient configured to follow redirects
                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                        .followRedirects(java.net.http.HttpClient.Redirect.ALWAYS)
                        .build();
                java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://www.youtube.com/results?search_query=" + encodedQuery))
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                        .GET()
                        .build();

                java.net.http.HttpResponse<String> httpResponse = client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());
                String html = httpResponse.body();

                if (html != null) {
                    java.util.regex.Pattern videoPattern = java.util.regex.Pattern.compile("\"videoId\":\"([a-zA-Z0-9_-]{11})\"");
                    java.util.regex.Matcher videoMatcher = videoPattern.matcher(html);
                    
                    int count = 0;
                    java.util.Set<String> uniqueIds = new java.util.HashSet<>();
                    
                    while (videoMatcher.find() && count < 2) {
                        String videoId = videoMatcher.group(1);
                        if (uniqueIds.contains(videoId)) {
                            continue;
                        }
                        uniqueIds.add(videoId);
                        
                        // Try to find title near the videoId in HTML (often following it)
                        String title = topicTitle + " Tutorial";
                        java.util.regex.Pattern titlePattern = java.util.regex.Pattern.compile(
                                "\"videoId\":\"" + java.util.regex.Pattern.quote(videoId) + "\".*?\"title\":\\{\"runs\":\\[\\{\"text\":\"(.*?)\"\\}\\]"
                        );
                        java.util.regex.Matcher titleMatcher = titlePattern.matcher(html);
                        if (titleMatcher.find()) {
                            title = titleMatcher.group(1);
                            // Clean up common JSON escapes
                            title = title.replace("\\u0026", "&")
                                         .replace("\\\"", "\"")
                                         .replace("\\\\", "\\");
                        }
                        
                        resources.add(Resource.builder()
                                .type(ResourceType.YOUTUBE)
                                .title(title)
                                .url("https://www.youtube.com/watch?v=" + videoId)
                                .description("Watch a structured tutorial video about: " + topicTitle)
                                .thumbnailUrl("https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg")
                                .build());
                        count++;
                    }
                }
            } catch (Exception scrapeEx) {
                System.err.println("YouTube search scraping fallback failed: " + scrapeEx.getMessage());
            }

            // If scraping also failed and list is empty, return a specific watch video for the skill as fallback
            if (resources.isEmpty()) {
                String fallbackVideoId = getFallbackVideoIdForSkill(skill);
                if (fallbackVideoId != null) {
                    resources.add(Resource.builder()
                            .type(ResourceType.YOUTUBE)
                            .title(topicTitle + " - Recommended Video")
                            .url("https://www.youtube.com/watch?v=" + fallbackVideoId)
                            .description("Watch a structured tutorial video about: " + topicTitle)
                            .thumbnailUrl("https://img.youtube.com/vi/" + fallbackVideoId + "/mqdefault.jpg")
                            .build());
                } else {
                    resources.add(Resource.builder()
                            .type(ResourceType.YOUTUBE)
                            .title("Search on YouTube: " + topicTitle)
                            .url("https://www.youtube.com/results?search_query=" + encodedQuery)
                            .description("Explore more video tutorials directly on YouTube for: " + topicTitle)
                            .thumbnailUrl("")
                            .build());
                }
            }
        }

        return CompletableFuture.completedFuture(resources);
    }

    private List<Resource> getPredefinedVideos(String skill, String topicTitle) {
        String s = skill.toLowerCase();
        String t = topicTitle.toLowerCase();
        List<Resource> list = new ArrayList<>();
        
        String videoId = null;
        String title = topicTitle + " - Recommended Video";
        String description = "Learn " + topicTitle + " from a top-rated YouTube tutorial.";
        
        if (s.contains("docker")) {
            if (t.contains("vm") || t.contains("virtual") || t.contains("intro") || t.contains("overview") || t.contains("concept")) {
                videoId = "pTFZFxd4hOI";
                title = "Docker Tutorial for Beginners [Full Course]";
            } else if (t.contains("engine") || t.contains("architecture")) {
                videoId = "aCsLhU36U-4";
                title = "Docker Architecture & Internals Explained";
            } else if (t.contains("dockerfile") || t.contains("image")) {
                videoId = "3c-iM_9OObM";
                title = "How to Write a Dockerfile - Build Custom Images";
            } else if (t.contains("compose") || t.contains("multi-container")) {
                videoId = "DM65_JyGxCo";
                title = "Docker Compose Tutorial - Multi Container Setup";
            } else if (t.contains("volume") || t.contains("storage") || t.contains("persist")) {
                videoId = "0o5GD11GZtY";
                title = "Docker Volumes Explained - Persistent Storage";
            } else if (t.contains("network") || t.contains("port")) {
                videoId = "bKFMS5C4CG0";
                title = "Docker Networking Guide - Bridge, Host, Overlay";
            } else if (t.contains("security") || t.contains("root") || t.contains("limit")) {
                videoId = "zR2744H41sc";
                title = "Docker Security Best Practices for Containers";
            } else if (t.contains("swarm") || t.contains("orchestration")) {
                videoId = "4T1fV9X3g2k";
                title = "Docker Swarm Mode Tutorial - Container Orchestration";
            }
        } else if (s.contains("kubernetes") || s.contains("k8s")) {
            if (t.contains("architecture") || t.contains("intro") || t.contains("concept")) {
                videoId = "VnvRFRk_51k";
                title = "Kubernetes Architecture & Components Explained";
            } else if (t.contains("pod")) {
                videoId = "urE62R4_pGA";
                title = "What is a Pod in Kubernetes? K8s Pod Basics";
            } else if (t.contains("deployment") || t.contains("scale") || t.contains("replica")) {
                videoId = "mI24e4b1Xq8";
                title = "Kubernetes Deployments and ReplicaSets Guide";
            } else if (t.contains("service") || t.contains("port")) {
                videoId = "T4Z7amgskcY";
                title = "Kubernetes Services Explained - ClusterIP, NodePort, LoadBalancer";
            } else if (t.contains("secret") || t.contains("configmap")) {
                videoId = "k8vLhDsgYgo";
                title = "Kubernetes ConfigMaps and Secrets Tutorial";
            } else if (t.contains("storage") || t.contains("volume") || t.contains("claim")) {
                videoId = "9g0H2gP4v1I";
                title = "Kubernetes Persistent Volumes (PV, PVC, StorageClass) Explained";
            } else if (t.contains("ingress")) {
                videoId = "80Ew_fsV4rM";
                title = "Kubernetes Ingress Tutorial - Traffic Routing Guide";
            } else if (t.contains("helm")) {
                videoId = "-ykwb1d0DXU";
                title = "Helm Package Manager Tutorial for Kubernetes";
            }
        } else if (s.contains("react")) {
            if (t.contains("jsx") || t.contains("intro") || t.contains("component")) {
                videoId = "SqcY0GlETPk";
                title = "React JS Tutorial for Beginners - Getting Started";
            } else if (t.contains("state") || t.contains("hook") || t.contains("usestate") || t.contains("useeffect")) {
                videoId = "O6P86uwfdGP";
                title = "React state and Hooks Explained - useState & useEffect";
            } else if (t.contains("route") || t.contains("navigation")) {
                videoId = "oUZjO00NkhU";
                title = "React Router v6 Tutorial - Dynamic Client Routing";
            } else if (t.contains("context") || t.contains("drilling")) {
                videoId = "5LrDIWkK_Bc";
                title = "React Context API Explained - Share Global State";
            } else if (t.contains("usememo") || t.contains("usecall") || t.contains("memo")) {
                videoId = "THL1OPn72vo";
                title = "React useMemo and useCallback Hooks Tutorial";
            } else if (t.contains("zustand") || t.contains("redux") || t.contains("store")) {
                videoId = "H6a5hL9-H9A";
                title = "React Global State Management with Zustand";
            } else if (t.contains("query") || t.contains("fetch") || t.contains("cache")) {
                videoId = "novnyCoyt_o";
                title = "TanStack React Query Tutorial - Data Fetching & Caching";
            } else if (t.contains("test") || t.contains("jest")) {
                videoId = "7d_yAkn081A";
                title = "Testing React Apps with Jest & Testing Library";
            }
        } else if (s.contains("python")) {
            if (t.contains("syntax") || t.contains("intro") || t.contains("basic") || t.contains("flow")) {
                videoId = "_uQrJ0TkZlc";
                title = "Python for Beginners - Full Python Course";
            } else if (t.contains("functional") || t.contains("datastructure") || t.contains("comprehension") || t.contains("structure")) {
                videoId = "RSl87lqM0mY";
                title = "Python Data Structures and Algorithms Tutorial";
            } else if (t.contains("oop") || t.contains("class") || t.contains("object")) {
                videoId = "JeznW_7DlB0";
                title = "Object-Oriented Programming (OOP) in Python";
            } else if (t.contains("package") || t.contains("module") || t.contains("env")) {
                videoId = "3YGPW5fUGL4";
                title = "Python Virtual Environments & Packages Tutorial";
            } else if (t.contains("scrap") || t.contains("beautiful")) {
                videoId = "XVv6mJpfU5g";
                title = "Web Scraping in Python - Beautiful Soup Tutorial";
            } else if (t.contains("orm") || t.contains("sql") || t.contains("database")) {
                videoId = "43M5mZuzF3s";
                title = "Python SQLAlchemy Tutorial - Databases in Python";
            } else if (t.contains("api") || t.contains("fastapi") || t.contains("flask")) {
                videoId = "tLKKm18Rykg";
                title = "FastAPI Course - Build APIs in Python";
            } else if (t.contains("test") || t.contains("pytest")) {
                videoId = "cHYq1MRU70A";
                title = "Unit Testing in Python with PyTest - Tutorial";
            }
        } else if (s.contains("java")) {
            if (t.contains("syntax") || t.contains("intro") || t.contains("jvm")) {
                videoId = "A74TOX803D0";
                title = "Java Tutorial for Beginners [Full Course]";
            } else if (t.contains("oop") || t.contains("class") || t.contains("inherit")) {
                videoId = "eIrMbAQSU34";
                title = "Java Object-Oriented Programming (OOP) Guide";
            } else if (t.contains("collection") || t.contains("list") || t.contains("map")) {
                videoId = "viGpeG-N7y0";
                title = "Java Collections Framework Tutorial";
            } else if (t.contains("exception") || t.contains("io")) {
                videoId = "1XAfapg55-4";
                title = "Java Exceptions and Error Handling Guide";
            } else if (t.contains("stream") || t.contains("lambda")) {
                videoId = "q7Sg5Yd8L2Y";
                title = "Java Streams and Lambdas Tutorial";
            } else if (t.contains("thread") || t.contains("concur")) {
                videoId = "r_MbozD3220";
                title = "Java Multithreading and Concurrency Guide";
            } else if (t.contains("database") || t.contains("jdbc") || t.contains("jpa")) {
                videoId = "Moo3Zp7v66E";
                title = "Java Database Connectivity (JDBC) Tutorial";
            } else if (t.contains("spring") || t.contains("boot") || t.contains("rest")) {
                videoId = "35EQXmHKZYs";
                title = "Spring Boot Tutorial for Beginners - Full Course";
            }
        } else if (s.contains("sql")) {
            if (t.contains("basic") || t.contains("intro") || t.contains("select") || t.contains("filter")) {
                videoId = "HXV3zeQKqGY";
                title = "SQL Tutorial for Beginners [Full Course]";
            } else if (t.contains("join") || t.contains("merge")) {
                videoId = "9yeEl15MCgs";
                title = "SQL Joins Explained - Inner, Left, Right, Outer";
            } else if (t.contains("subquery") || t.contains("cte") || t.contains("with")) {
                videoId = "YgU-J7PqVqg";
                title = "SQL CTEs and Subqueries Tutorial Guide";
            } else if (t.contains("schema") || t.contains("ddl") || t.contains("create")) {
                videoId = "BPHAr4Qdyw4";
                title = "SQL Database Design & Schema DDL Tutorial";
            } else if (t.contains("index") || t.contains("plan") || t.contains("explain")) {
                videoId = "H5dC0N26Z1A";
                title = "SQL Database Indexing & EXPLAIN Plans";
            } else if (t.contains("transaction") || t.contains("acid") || t.contains("concur")) {
                videoId = "4Eajf_F53es";
                title = "Database Transactions and ACID Properties";
            } else if (t.contains("procedure") || t.contains("trigger") || t.contains("view")) {
                videoId = "lPcoAOp4fN0";
                title = "SQL Views, Stored Procedures, and Triggers";
            } else if (t.contains("window") || t.contains("rank") || t.contains("partition")) {
                videoId = "Ww71COjSgqs";
                title = "SQL Window Functions Tutorial - Over & Partition By";
            }
        } else if (s.contains("git") || s.contains("github")) {
            if (t.contains("basic") || t.contains("intro") || t.contains("commit")) {
                videoId = "8JJ101D3knE";
                title = "Git & GitHub Tutorial for Beginners";
            } else if (t.contains("branch") || t.contains("merge") || t.contains("conflict")) {
                videoId = "oPpnCh7InLY";
                title = "Git Branching and Merging Tutorial - Conflict Resolution";
            } else if (t.contains("remote") || t.contains("pull") || t.contains("collaborat")) {
                videoId = "RGOj5yH7evk";
                title = "GitHub Collaboration Workflow - Pull Requests & Remotes";
            } else if (t.contains("rebase") || t.contains("squash")) {
                videoId = "f1wnYdLE4y8";
                title = "Git Rebase Explained - Clean Git History";
            } else if (t.contains("cherry") || t.contains("revert") || t.contains("reset")) {
                videoId = "25h_N47_oBY";
                title = "Git Reset, Revert, and Cherry-Pick Tutorial";
            } else if (t.contains("stash") || t.contains("tag") || t.contains("clean")) {
                videoId = "Kee8jAghz6g";
                title = "Git Stash & Git Tag Tutorial";
            } else if (t.contains("hook") || t.contains("automat")) {
                videoId = "gK4o054P_wM";
                title = "Git Hooks Automation Tutorial";
            } else if (t.contains("internal") || t.contains("blob") || t.contains("reflog")) {
                videoId = "lG908568a80";
                title = "Git Internals - How Git Works Under the Hood";
            }
        } else if (s.contains("machine learning") || s.contains("ml")) {
            if (t.contains("numpy") || t.contains("pandas") || t.contains("python") || t.contains("intro")) {
                videoId = "GwIo3gDZCVQ";
                title = "Machine Learning Course for Beginners - Basics";
            } else if (t.contains("supervised") || t.contains("regress") || t.contains("class")) {
                videoId = "4b5d3muPQmA";
                title = "Supervised Machine Learning Algorithms Explained";
            } else if (t.contains("eval") || t.contains("tune") || t.contains("metric")) {
                videoId = "p5z-t4g44fU";
                title = "Machine Learning Model Evaluation & Hyperparameter Tuning";
            } else if (t.contains("unsupervised") || t.contains("cluster") || t.contains("pca")) {
                videoId = "pTHeMCoa8S0";
                title = "Unsupervised Learning - K-Means & PCA Clustering";
            } else if (t.contains("deep") || t.contains("neural") || t.contains("perceptron")) {
                videoId = "aircAruvnKk";
                title = "But what is a neural network? Deep Learning Chapter 1";
            } else if (t.contains("convolution") || t.contains("cnn") || t.contains("vision")) {
                videoId = "YRhxdVk_sIs";
                title = "Convolutional Neural Networks (CNNs) Explained";
            } else if (t.contains("recurrent") || t.contains("nlp") || t.contains("transformer") || t.contains("text")) {
                videoId = "ySEx_BqxpGY";
                title = "Recurrent Neural Networks (RNN) and LSTM Explained";
            } else if (t.contains("mlops") || t.contains("deploy") || t.contains("serialize") || t.contains("api")) {
                videoId = "j1H7G6B6J8s";
                title = "MLOps Tutorial - Deploying ML Models as APIs";
            }
        }
        
        if (videoId != null) {
            list.add(Resource.builder()
                    .type(ResourceType.YOUTUBE)
                    .title(title)
                    .url("https://www.youtube.com/watch?v=" + videoId)
                    .description(description)
                    .thumbnailUrl("https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg")
                    .build());
        }
        
        return list;
    }

    private String getFallbackVideoIdForSkill(String skill) {
        String s = skill.toLowerCase();
        if (s.contains("docker")) return "pTFZFxd4hOI";
        if (s.contains("kubernetes") || s.contains("k8s")) return "VnvRFRk_51k";
        if (s.contains("react")) return "SqcY0GlETPk";
        if (s.contains("python")) return "_uQrJ0TkZlc";
        if (s.contains("java")) return "A74TOX803D0";
        if (s.contains("sql")) return "HXV3zeQKqGY";
        if (s.contains("git") || s.contains("github")) return "8JJ101D3knE";
        if (s.contains("machine learning") || s.contains("ml")) return "GwIo3gDZCVQ";
        if (s.contains("terraform")) return "7xhyoU9SpEw";
        if (s.contains("ansible")) return "g8wipG7895Y";
        if (s.contains("rust")) return "2hXNd6x9sZs";
        if (s.contains("go") || s.equals("golang")) return "YS4e4q9oBaU";
        if (s.contains("aws") || s.contains("amazon")) return "3hLmDS179YE";
        if (s.contains("javascript") || s.contains("js")) return "W6NZfCO5SIk";
        if (s.contains("html") || s.contains("css")) return "DPnqb74Fugw";
        if (s.contains("typescript") || s.contains("ts")) return "d56mG7DezGs";
        if (s.contains("spring") || s.contains("boot")) return "35EQXmHKZYs";
        return null;
    }
}

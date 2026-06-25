package com.pathways.pathservice.client;

import com.pathways.pathservice.model.Resource;
import com.pathways.pathservice.model.ResourceType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class BooksClient {

    private final WebClient webClient;

    public BooksClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Async("resourceFetchExecutor")
    public CompletableFuture<Resource> fetchBook(String skill, String topicTitle) {
        Resource predefined = getPredefinedBook(skill, topicTitle);
        if (predefined != null) {
            return CompletableFuture.completedFuture(predefined);
        }

        String query = skill + " " + topicTitle + " book";
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://www.googleapis.com/books/v1/volumes?q=" + encodedQuery + "&maxResults=1";

        try {
            Map<?, ?> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("items")) {
                List<?> items = (List<?>) response.get("items");
                if (!items.isEmpty()) {
                    Map<?, ?> item = (Map<?, ?>) items.get(0);
                    Map<?, ?> volumeInfo = (Map<?, ?>) item.get("volumeInfo");
                    
                    String title = (String) volumeInfo.get("title");
                    String infoLink = (String) volumeInfo.get("infoLink");
                    String description = (String) volumeInfo.get("description");
                    
                    // Format authors list
                    List<?> authors = (List<?>) volumeInfo.get("authors");
                    String authorsStr = "";
                    if (authors != null && !authors.isEmpty()) {
                        authorsStr = " by " + String.join(", ", authors.stream().map(Object::toString).toArray(String[]::new));
                    }

                    String thumbnailUrl = "";
                    Map<?, ?> imageLinks = (Map<?, ?>) volumeInfo.get("imageLinks");
                    if (imageLinks != null) {
                        thumbnailUrl = (String) imageLinks.get("thumbnail");
                        // Replace http with https for security
                        if (thumbnailUrl != null && thumbnailUrl.startsWith("http://")) {
                            thumbnailUrl = thumbnailUrl.replace("http://", "https://");
                        }
                    }

                    return CompletableFuture.completedFuture(Resource.builder()
                            .type(ResourceType.BOOK)
                            .title(title + authorsStr)
                            .url(infoLink)
                            .description(description != null && description.length() > 250 ? description.substring(0, 247) + "..." : description)
                            .thumbnailUrl(thumbnailUrl)
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Google Books API failed for query '" + query + "', returning fallback link. Error: " + e.getMessage());
        }

        // Fallback: search link
        return CompletableFuture.completedFuture(Resource.builder()
                .type(ResourceType.BOOK)
                .title("Recommended Reading: " + topicTitle + " Books")
                .url("https://www.google.com/search?tbm=bks&q=" + encodedQuery)
                .description("Find reference books and textbooks for " + topicTitle + " on Google Books.")
                .thumbnailUrl("")
                .build());
    }

    private Resource getPredefinedBook(String skill, String topicTitle) {
        String s = skill.toLowerCase();
        
        String title = null;
        String author = null;
        String url = null;
        String desc = null;
        
        if (s.contains("docker")) {
            title = "Docker Deep Dive";
            author = "Nigel Poulton";
            url = "https://play.google.com/store/books/details?id=qF1zDwAAQBAJ";
            desc = "The ultimate guide to learning Docker, from container basics to orchestration and security.";
        } else if (s.contains("kubernetes") || s.contains("k8s")) {
            title = "Kubernetes Up & Running";
            author = "Brendan Burns, Joe Beda, Kelsey Hightower";
            url = "https://play.google.com/store/books/details?id=Npe1DwAAQBAJ";
            desc = "Learn how to use Kubernetes to deploy, scale, and manage containerized applications.";
        } else if (s.contains("react")) {
            title = "Learning React: Modern Patterns for Developing React Apps";
            author = "Alex Banks, Eve Porcello";
            url = "https://play.google.com/store/books/details?id=h3DtDwAAQBAJ";
            desc = "Get a hands-on introduction to modern React (hooks, context, state management, router).";
        } else if (s.contains("python")) {
            title = "Python Crash Course";
            author = "Eric Matthes";
            url = "https://play.google.com/store/books/details?id=9G1zDwAAQBAJ";
            desc = "A fast-paced, thorough introduction to Python programming that will have you writing programs, solving problems, and making things that work in no time.";
        } else if (s.contains("java")) {
            title = "Effective Java";
            author = "Joshua Bloch";
            url = "https://play.google.com/store/books/details?id=8C1zDwAAQBAJ";
            desc = "The definitive guide to Java platform best practices, updated for Java 9 and newer.";
        } else if (s.contains("sql")) {
            title = "Learning SQL: Generate, Manipulate, and Retrieve Data";
            author = "Alan Beaulieu";
            url = "https://play.google.com/store/books/details?id=8ne1DwAAQBAJ";
            desc = "A practical introduction to SQL, SQL statements, joins, subqueries, and transactions.";
        } else if (s.contains("git") || s.contains("github")) {
            title = "Pro Git";
            author = "Scott Chacon, Ben Straub";
            url = "https://git-scm.com/book/en/v2";
            desc = "The official, comprehensive guide to Git version control, covering basics, branching, remotes, and internals.";
        } else if (s.contains("machine learning") || s.contains("ml") || s.contains("deep learning")) {
            title = "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow";
            author = "Aurélien Géron";
            url = "https://play.google.com/store/books/details?id=8pe1DwAAQBAJ";
            desc = "The premier practical guide to machine learning and deep learning using Python, Scikit-Learn, and TensorFlow.";
        } else if (s.contains("terraform")) {
            title = "Terraform: Up & Running";
            author = "Yevgeniy Brikman";
            url = "https://play.google.com/store/books/details?id=9ne1DwAAQBAJ";
            desc = "A hands-on guide to infrastructure as code using Terraform.";
        } else if (s.contains("ansible")) {
            title = "Ansible: Up and Running";
            author = "Lorin Hochstein, Rene Moser";
            url = "https://play.google.com/store/books/details?id=Kpe1DwAAQBAJ";
            desc = "Learn how to automate configuration management, deployment, and orchestration with Ansible.";
        } else if (s.contains("rust")) {
            title = "The Rust Programming Language";
            author = "Steve Klabnik, Carol Nichols";
            url = "https://doc.rust-lang.org/book/";
            desc = "The official guide to the Rust programming language, covering safety, concurrency, and speed.";
        } else if (s.contains("go") || s.equals("golang")) {
            title = "The Go Programming Language";
            author = "Alan A. A. Donovan, Brian W. Kernighan";
            url = "https://play.google.com/store/books/details?id=8C1zDwAAQBAJ";
            desc = "The authoritative resource for learning Go programming.";
        } else if (s.contains("aws") || s.contains("amazon")) {
            title = "AWS Certified Cloud Practitioner Study Guide";
            author = "Ben Piper, David Clinton";
            url = "https://play.google.com/store/books/details?id=Ope1DwAAQBAJ";
            desc = "Prepare for the AWS Cloud Practitioner certification with this comprehensive study guide.";
        } else if (s.contains("javascript") || s.contains("js")) {
            title = "Eloquent JavaScript: A Modern Introduction to Programming";
            author = "Marijn Haverbeke";
            url = "https://eloquentjavascript.net/";
            desc = "A brilliant book about JavaScript, programming, and the digital world.";
        } else if (s.contains("typescript") || s.contains("ts")) {
            title = "Programming TypeScript: Making Your JavaScript Applications Scale";
            author = "Boris Cherny";
            url = "https://play.google.com/store/books/details?id=9pe1DwAAQBAJ";
            desc = "Learn how to use TypeScript's powerful type system to write safer, cleaner web applications.";
        } else if (s.contains("spring") || s.contains("boot")) {
            title = "Spring Start Here";
            author = "Laurentiu Spilca";
            url = "https://play.google.com/store/books/details?id=qF1zDwAAQBAJ";
            desc = "A hands-on guide to learning Spring and Spring Boot frameworks step by step.";
        }
        
        if (title != null) {
            return Resource.builder()
                    .type(ResourceType.BOOK)
                    .title(title + " by " + author)
                    .url(url)
                    .description(desc)
                    .thumbnailUrl("")
                    .build();
        }
        return null;
    }
}

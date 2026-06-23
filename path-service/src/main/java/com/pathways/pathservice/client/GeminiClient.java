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
    private final ObjectMapper objectMapper;

    public GeminiClient(
            WebClient.Builder webClientBuilder,
            @Value("${gemini.apiKey}") String apiKey,
            @Value("${gemini.url}") String apiUrl,
            ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.objectMapper = objectMapper;
    }

    public GeminiPathResponse generateLearningPath(String skill, String level, String goal, String studyHours, String learningStyle) {
        String prompt = buildPrompt(skill, level, goal, studyHours, learningStyle);

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
            return getFallbackPathResponse(skill, level, goal);
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
              .append("3. Each topic must have a title, short description, and a 'suggestedDocUrl' which is a real official documentation link or highly reputable article link for that topic (e.g., MDN, React Docs, Spring Docs, Wikipedia, etc.).\n")
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
              .append("          \"suggestedDocUrl\": \"https://example.com/docs\"\n")
              .append("        }\n")
              .append("      ]\n")
              .append("    }\n")
              .append("  ]\n")
              .append("}");

        return prompt.toString();
    }

    private GeminiPathResponse getFallbackPathResponse(String skill, String level, String goal) {
        List<GeminiPathResponse.GeminiWeek> weeks = new java.util.ArrayList<>();
        String normalizedSkill = skill.trim().toLowerCase();

        if (normalizedSkill.contains("machine learning") || normalizedSkill.contains("ml")) {
            weeks.add(new GeminiPathResponse.GeminiWeek(1, "Fundamentals of Mathematics & Python for ML", 
                List.of("Refresh linear algebra and calculus concepts", "Set up Python ML environment", "Understand NumPy and Pandas"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Linear Algebra Basics", "Matrix multiplications, eigenvalues, and vectors essential for machine learning algorithms.", "https://en.wikipedia.org/wiki/Linear_algebra"),
                    new GeminiPathResponse.GeminiTopic("Python for Data Analysis", "Introduction to NumPy arrays, Pandas DataFrames, and operations for data manipulation.", "https://pandas.pydata.org/docs/user_guide/index.html"),
                    new GeminiPathResponse.GeminiTopic("Calculus & Optimization", "Partial derivatives, gradients, and gradient descent optimization foundations.", "https://en.wikipedia.org/wiki/Gradient_descent")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(2, "Supervised Learning Algorithms", 
                List.of("Understand regression techniques", "Master classification models", "Learn validation and metric evaluation"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Linear & Logistic Regression", "Theoretical foundations and scikit-learn implementation of regression algorithms.", "https://scikit-learn.org/stable/modules/linear_model.html"),
                    new GeminiPathResponse.GeminiTopic("Decision Trees & Random Forests", "Tree-based methods, ensemble learning, and hyperparameter tuning.", "https://scikit-learn.org/stable/modules/tree.html"),
                    new GeminiPathResponse.GeminiTopic("Model Evaluation Metrics", "Confusion matrix, Precision, Recall, F1-Score, and ROC-AUC curves.", "https://scikit-learn.org/stable/modules/model_evaluation.html")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(3, "Unsupervised Learning & Dimensionality Reduction", 
                List.of("Understand clustering techniques", "Learn PCA and t-SNE", "Implement clustering on real datasets"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("K-Means & Hierarchical Clustering", "Grouping unlabeled data points into clusters based on distance metrics.", "https://scikit-learn.org/stable/modules/clustering.html"),
                    new GeminiPathResponse.GeminiTopic("Principal Component Analysis (PCA)", "Reducing feature dimensions while preserving variance.", "https://en.wikipedia.org/wiki/Principal_component_analysis")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(4, "Deep Learning Foundations & Neural Networks", 
                List.of("Understand artificial neurons and activation functions", "Implement a simple Multi-Layer Perceptron", "Learn Backpropagation"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Neural Network Architecture", "Input, hidden, and output layers, weights, biases, and activation functions.", "https://en.wikipedia.org/wiki/Artificial_neural_network"),
                    new GeminiPathResponse.GeminiTopic("Backpropagation & Training", "Loss functions, optimization algorithms, and calculating gradients.", "https://en.wikipedia.org/wiki/Backpropagation")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(5, "Convolutional & Recurrent Networks", 
                List.of("Understand CNNs for computer vision", "Understand RNNs and LSTMs for sequential data"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Convolutional Neural Networks (CNN)", "Convolution operations, pooling layers, and image classification applications.", "https://en.wikipedia.org/wiki/Convolutional_neural_network"),
                    new GeminiPathResponse.GeminiTopic("Recurrent Neural Networks & LSTM", "Handling sequential data, natural language processing, and memory cells.", "https://en.wikipedia.org/wiki/Long_short-term_memory")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(6, "MLOps & Deploying Models", 
                List.of("Learn model serialization", "Deploy an ML model as a REST API", "Understand monitoring"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Model Saving & Loading", "Using joblib or pickle to serialize scikit-learn and deep learning models.", "https://scikit-learn.org/stable/model_persistence.html"),
                    new GeminiPathResponse.GeminiTopic("Model Deployment as API", "Wrapping models in a FastAPI or Flask app and containerizing with Docker.", "https://fastapi.tiangolo.com/")
                )
            ));
        } else if (normalizedSkill.contains("react")) {
            weeks.add(new GeminiPathResponse.GeminiWeek(1, "React Core Concepts & JSX", 
                List.of("Understand JSX and components", "Learn props and styling", "Create your first interactive app"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("JSX & Rendering", "Writing HTML-like code inside JavaScript and how React renders elements.", "https://react.dev/learn/writing-markup-with-jsx"),
                    new GeminiPathResponse.GeminiTopic("Components & Props", "Functional components, custom props, and passing data down the tree.", "https://react.dev/learn/passing-props-to-a-component")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(2, "State Management & React Hooks", 
                List.of("Master useState hook", "Master useEffect hook", "Understand hook dependencies"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("useState Hook", "Managing local component state and triggering re-renders dynamically.", "https://react.dev/reference/react/useState"),
                    new GeminiPathResponse.GeminiTopic("useEffect Hook", "Handling side effects like API fetching, subscriptions, and DOM updates.", "https://react.dev/reference/react/useEffect")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(3, "Routing & Context API", 
                List.of("Set up React Router", "Share global state using Context API", "Implement protected routes"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("React Router", "Configuring paths, route structures, dynamic routing, and URL parameters.", "https://reactrouter.com/"),
                    new GeminiPathResponse.GeminiTopic("Context API", "Creating context providers and consuming global values without prop drilling.", "https://react.dev/reference/react/createContext")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(4, "Advanced Patterns & State Libraries", 
                List.of("Create custom hooks", "Understand memoization", "Learn Zustand or Redux Toolkit"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Custom Hooks", "Extracting reusable stateful logic into clean, custom hook functions.", "https://react.dev/learn/reusing-logic-with-custom-hooks"),
                    new GeminiPathResponse.GeminiTopic("Zustand State Store", "Setting up a lightweight, robust external state store for React.", "https://zustand-demo.pmnd.rs/")
                )
            ));
        } else {
            String capitalizedSkill = skill.substring(0, 1).toUpperCase() + (skill.length() > 1 ? skill.substring(1) : "");
            weeks.add(new GeminiPathResponse.GeminiWeek(1, "Fundamentals of " + capitalizedSkill, 
                List.of("Understand core terminology of " + skill, "Set up development tools and environments", "Write basic programs"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Introduction to " + capitalizedSkill, "Historical background, core use cases, and setup steps.", "https://en.wikipedia.org/wiki/" + capitalizedSkill.replace(" ", "_")),
                    new GeminiPathResponse.GeminiTopic("Environment & Tooling Setup", "Installing SDKs, setting up code editors, and configuring local projects.", "https://example.com/docs")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(2, "Core Mechanics & Key Concepts", 
                List.of("Learn data flows and structures in " + skill, "Implement logic and conditional structures", "Build small practical features"),
                List.of(
                    new GeminiPathResponse.GeminiTopic(capitalizedSkill + " Architecture", "Understanding compilation, runtime, and framework lifecycles.", "https://example.com/docs/architecture"),
                    new GeminiPathResponse.GeminiTopic("Key APIs and Libraries", "Working with standard packages, utility methods, and default configurations.", "https://example.com/docs/api")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(3, "Advanced Features & Integration", 
                List.of("Connect " + skill + " to external database or API services", "Handle errors, exceptions, and security practices", "Manage state transitions"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("State & Data Operations", "Fetching, posting, and storing local state securely.", "https://example.com/docs/data"),
                    new GeminiPathResponse.GeminiTopic("Error Management & Best Practices", "Building resilient configurations, handling edge cases, and testing.", "https://example.com/docs/errors")
                )
            ));
            weeks.add(new GeminiPathResponse.GeminiWeek(4, "Project Implementation & Deployment", 
                List.of("Build a full production-ready " + skill + " project", "Write unit and validation tests", "Deploy to cloud environments"),
                List.of(
                    new GeminiPathResponse.GeminiTopic("Final Project Assembly", "Integrating all concepts into a functional, portfolio-ready application.", "https://example.com/docs/project"),
                    new GeminiPathResponse.GeminiTopic("Testing & Deployment", "Configuring CI/CD, writing test cases, and launching live servers.", "https://example.com/docs/deploy")
                )
            ));
        }

        return new GeminiPathResponse(weeks);
    }
}

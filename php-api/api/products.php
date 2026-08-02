<?php
/**
 * Products API Endpoint - PHP Database Layer
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$request_method = $_SERVER["REQUEST_METHOD"];

switch($request_method) {
    case 'GET':
        if (!empty($_GET["id"])) {
            // Get single product
            $query = "SELECT * FROM products WHERE id = ? LIMIT 0,1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $_GET["id"]);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                $product_arr = array(
                    "id" => intval($row['id']),
                    "name" => $row['name'],
                    "description" => $row['description'],
                    "price" => $row['price'],
                    "weight" => $row['weight'],
                    "categoryId" => intval($row['category_id']),
                    "images" => json_decode($row['images']),
                    "videos" => json_decode($row['videos']),
                    "stock" => intval($row['stock']),
                    "isActive" => boolval($row['isActive']),
                    "featured" => boolval($row['featured']),
                    "createdAt" => $row['createdAt'],
                    "updatedAt" => $row['updatedAt']
                );
                
                http_response_code(200);
                echo json_encode($product_arr);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Product not found."));
            }
        } else {
            // Get all products with filters
            $query = "SELECT * FROM products WHERE isActive = 1";
            
            if (isset($_GET['categoryId'])) {
                $query .= " AND category_id = :category_id";
            }
            
            if (isset($_GET['featured'])) {
                $query .= " AND featured = 1";
            }
            
            if (isset($_GET['search'])) {
                $query .= " AND name LIKE :search";
            }
            
            $query .= " ORDER BY createdAt DESC";

            $stmt = $db->prepare($query);

            if (isset($_GET['categoryId'])) {
                $stmt->bindParam(":category_id", $_GET['categoryId']);
            }
            
            if (isset($_GET['search'])) {
                $search_term = "%" . $_GET['search'] . "%";
                $stmt->bindParam(":search", $search_term);
            }

            $stmt->execute();
            $num = $stmt->rowCount();

            if ($num > 0) {
                $products_arr = array();

                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $product_item = array(
                        "id" => intval($row['id']),
                        "name" => $row['name'],
                        "description" => $row['description'],
                        "price" => $row['price'],
                        "weight" => $row['weight'],
                        "categoryId" => intval($row['category_id']),
                        "images" => json_decode($row['images']),
                        "videos" => json_decode($row['videos']),
                        "stock" => intval($row['stock']),
                        "isActive" => boolval($row['isActive']),
                        "featured" => boolval($row['featured']),
                        "createdAt" => $row['createdAt'],
                        "updatedAt" => $row['updatedAt']
                    );

                    array_push($products_arr, $product_item);
                }

                http_response_code(200);
                echo json_encode($products_arr);
            } else {
                http_response_code(200);
                echo json_encode(array());
            }
        }
        break;

    case 'POST':
        // Create product
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->name) && !empty($data->price)) {
            $query = "INSERT INTO products SET name=:name, description=:description, price=:price, weight=:weight, category_id=:category_id, images=:images, videos=:videos, stock=:stock, featured=:featured, createdAt=NOW(), updatedAt=NOW()";
            $stmt = $db->prepare($query);

            $name = htmlspecialchars(strip_tags($data->name));
            $description = htmlspecialchars(strip_tags($data->description));
            $price = htmlspecialchars(strip_tags($data->price));
            $weight = htmlspecialchars(strip_tags($data->weight));
            $images = json_encode($data->images);
            $videos = json_encode($data->videos);
            $featured = isset($data->featured) ? $data->featured : 0;

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":description", $description);
            $stmt->bindParam(":price", $price);
            $stmt->bindParam(":weight", $weight);
            $stmt->bindParam(":category_id", $data->categoryId);
            $stmt->bindParam(":images", $images);
            $stmt->bindParam(":videos", $videos);
            $stmt->bindParam(":stock", $data->stock);
            $stmt->bindParam(":featured", $featured);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Product created successfully.", "id" => $db->lastInsertId()));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create product."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to create product. Data is incomplete."));
        }
        break;

    case 'PUT':
        // Update product
        $data = json_decode(file_get_contents("php://input"));

        $query = "UPDATE products SET name = :name, description = :description, price = :price, weight = :weight, category_id = :category_id, images = :images, videos = :videos, stock = :stock, featured = :featured, updatedAt = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);

        $name = htmlspecialchars(strip_tags($data->name));
        $description = htmlspecialchars(strip_tags($data->description));
        $price = htmlspecialchars(strip_tags($data->price));
        $weight = htmlspecialchars(strip_tags($data->weight));
        $images = json_encode($data->images);
        $videos = json_encode($data->videos);

        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":price", $price);
        $stmt->bindParam(":weight", $weight);
        $stmt->bindParam(":category_id", $data->categoryId);
        $stmt->bindParam(":images", $images);
        $stmt->bindParam(":videos", $videos);
        $stmt->bindParam(":stock", $data->stock);
        $stmt->bindParam(":featured", $data->featured);
        $stmt->bindParam(":id", $data->id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Product updated successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to update product."));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
"""seed articles full text

Revision ID: b3c4d5e6f7g8
Revises: a9eeee7a42e2
Create Date: 2025-06-05 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
import uuid

# revision identifiers
revision = 'b3c4d5e6f7g8'
down_revision = 'a9eeee7a42e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Определяем таблицу для вставки данных
    articles_full_text_table = table('articles_full_text',
        column('article_id', sa.UUID),
        column('commit_id', sa.UUID),
        column('text', sa.Text)
    )
    
    # Получаем существующие ID из предыдущей миграции
    # Эти ID должны соответствовать тем, что были созданы в seed_test_data.py
    
    # IDs статей (из seed_test_data.py)
    article1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440001')  # FastAPI tutorial
    article2_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440002')  # PostgreSQL guide
    article3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440003')  # ML basics
    
    # IDs коммитов (из seed_test_data.py)
    commit1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440011')  # FastAPI initial
    commit2_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440012')  # FastAPI installation
    commit3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440013')  # PostgreSQL initial
    commit4_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440014')  # ML initial
    commit5_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440015')  # FastAPI testing
    
    # Вставляем полные тексты статей для каждого коммита
    op.bulk_insert(articles_full_text_table, [
        {
            'article_id': article1_id,
            'commit_id': commit1_id,
            'text': '''# Introduction to Python FastAPI

FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.

## Key Features
- Fast: Very high performance, on par with NodeJS and Go
- Fast to code: Increase the speed to develop features by about 200% to 300%
- Fewer bugs: Reduce about 40% of human (developer) induced errors
- Intuitive: Great editor support with autocompletion everywhere
- Easy: Designed to be easy to use and learn
- Short: Minimize code duplication
- Robust: Get production-ready code with automatic interactive documentation

## Why Choose FastAPI?

FastAPI was created by Sebastián Ramirez and has quickly become one of the most popular Python web frameworks. It combines the simplicity of Flask with the robustness of Django, while providing automatic API documentation generation.

The framework is built on top of Starlette for the web parts and Pydantic for the data parts, which means you get excellent performance and data validation out of the box.'''
        },
        {
            'article_id': article1_id,
            'commit_id': commit2_id,
            'text': '''# Introduction to Python FastAPI

FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.

## Key Features
- Fast: Very high performance, on par with NodeJS and Go
- Fast to code: Increase the speed to develop features by about 200% to 300%
- Fewer bugs: Reduce about 40% of human (developer) induced errors
- Intuitive: Great editor support with autocompletion everywhere
- Easy: Designed to be easy to use and learn
- Short: Minimize code duplication
- Robust: Get production-ready code with automatic interactive documentation

## Why Choose FastAPI?

FastAPI was created by Sebastián Ramirez and has quickly become one of the most popular Python web frameworks. It combines the simplicity of Flask with the robustness of Django, while providing automatic API documentation generation.

The framework is built on top of Starlette for the web parts and Pydantic for the data parts, which means you get excellent performance and data validation out of the box.

## Installation

You can install FastAPI using pip. We recommend installing it along with uvicorn, an ASGI server:

```bash
pip install fastapi
pip install "uvicorn[standard]"
```

Alternatively, you can install everything at once:

```bash
pip install "fastapi[all]"
```

## Basic Example

Here's a simple FastAPI application to get you started:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

This example demonstrates:
- Creating a FastAPI instance
- Defining path operations with decorators
- Using path parameters with type hints
- Using query parameters with default values'''
        },
        {
            'article_id': article1_id,
            'commit_id': commit5_id,
            'text': '''# Introduction to Python FastAPI

FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.

## Key Features
- Fast: Very high performance, on par with NodeJS and Go
- Fast to code: Increase the speed to develop features by about 200% to 300%
- Fewer bugs: Reduce about 40% of human (developer) induced errors
- Intuitive: Great editor support with autocompletion everywhere
- Easy: Designed to be easy to use and learn
- Short: Minimize code duplication
- Robust: Get production-ready code with automatic interactive documentation

## Why Choose FastAPI?

FastAPI was created by Sebastián Ramirez and has quickly become one of the most popular Python web frameworks. It combines the simplicity of Flask with the robustness of Django, while providing automatic API documentation generation.

The framework is built on top of Starlette for the web parts and Pydantic for the data parts, which means you get excellent performance and data validation out of the box.

## Installation

You can install FastAPI using pip. We recommend installing it along with uvicorn, an ASGI server:

```bash
pip install fastapi
pip install "uvicorn[standard]"
```

Alternatively, you can install everything at once:

```bash
pip install "fastapi[all]"
```

## Basic Example

Here's a simple FastAPI application to get you started:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

This example demonstrates:
- Creating a FastAPI instance
- Defining path operations with decorators
- Using path parameters with type hints
- Using query parameters with default values

## Testing Your API

To test your FastAPI application, save your code in a file called `main.py` and run:

```bash
uvicorn main:app --reload
```

The `--reload` flag enables auto-reload during development, so the server will restart whenever you make changes to your code.

Once the server is running, you can:
- Visit http://127.0.0.1:8000 to see your API in action
- Visit http://127.0.0.1:8000/docs for interactive API documentation (Swagger UI)
- Visit http://127.0.0.1:8000/redoc for alternative API documentation (ReDoc)

## Next Steps

Now that you have a basic FastAPI application running, you can explore more advanced features such as:
- Request and response models with Pydantic
- Database integration
- Authentication and authorization
- Background tasks
- WebSocket support'''
        },
        {
            'article_id': article2_id,
            'commit_id': commit3_id,
            'text': '''# Advanced PostgreSQL Queries

This comprehensive guide covers advanced PostgreSQL query techniques that will help you write more efficient and powerful database queries. We'll explore window functions, common table expressions (CTEs), complex joins, and other advanced features that make PostgreSQL a powerful database system.

## Window Functions

Window functions perform calculations across a set of table rows that are somehow related to the current row. Unlike aggregate functions, window functions don't cause rows to become grouped into a single output row — the rows retain their separate identities.

### Basic Syntax

```sql
window_function() OVER (
    [PARTITION BY partition_expression]
    [ORDER BY sort_expression]
    [frame_clause]
)
```

### Common Window Functions

1. **ROW_NUMBER()**: Assigns a unique sequential integer to rows within a partition
2. **RANK()**: Assigns a rank to each row within a partition, with gaps
3. **DENSE_RANK()**: Assigns a rank to each row within a partition, without gaps
4. **LAG()** and **LEAD()**: Access data from previous or next rows

### Examples

```sql
-- Ranking employees by salary within each department
SELECT 
    employee_name,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank
FROM employees;

-- Running total of sales
SELECT 
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) as running_total
FROM sales;
```

## Common Table Expressions (CTEs)

CTEs provide a way to write auxiliary statements for use in a larger query. They can be thought of as defining temporary tables that exist just for one query.

### Basic CTE Syntax

```sql
WITH cte_name AS (
    SELECT ...
)
SELECT ... FROM cte_name;
```

### Recursive CTEs

PostgreSQL supports recursive CTEs, which are useful for hierarchical data:

```sql
WITH RECURSIVE employee_hierarchy AS (
    -- Base case: top-level managers
    SELECT employee_id, name, manager_id, 1 as level
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT e.employee_id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy ORDER BY level, name;
```

## Advanced Join Techniques

### LATERAL Joins

LATERAL joins allow you to reference columns from tables that appear before the LATERAL keyword:

```sql
SELECT c.name, t.transaction_date, t.amount
FROM customers c,
LATERAL (
    SELECT transaction_date, amount
    FROM transactions t
    WHERE t.customer_id = c.id
    ORDER BY transaction_date DESC
    LIMIT 3
) t;
```

### Self Joins

Useful for comparing rows within the same table:

```sql
-- Find employees who earn more than their managers
SELECT e1.name as employee, e2.name as manager
FROM employees e1
JOIN employees e2 ON e1.manager_id = e2.employee_id
WHERE e1.salary > e2.salary;
```

## Array Operations

PostgreSQL has powerful array functionality:

```sql
-- Working with arrays
SELECT 
    ARRAY[1,2,3,4] as numbers,
    ARRAY['a','b','c'] as letters,
    ARRAY(SELECT name FROM employees LIMIT 5) as employee_names;

-- Array functions
SELECT 
    array_length(ARRAY[1,2,3,4], 1) as length,
    unnest(ARRAY['red','green','blue']) as colors;
```

## JSON Operations

PostgreSQL provides excellent JSON support:

```sql
-- JSON queries
SELECT 
    data->>'name' as name,
    data->'address'->>'city' as city,
    jsonb_array_length(data->'hobbies') as hobby_count
FROM user_profiles
WHERE data @> '{"age": 25}';
```

This article will be expanded with more examples and practical use cases in future updates.'''
        },
        {
            'article_id': article3_id,
            'commit_id': commit4_id,
            'text': '''# Machine Learning Basics

An introduction to fundamental machine learning concepts and algorithms that will help you understand the core principles behind AI systems.

## What is Machine Learning?

Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and make decisions from data without being explicitly programmed for every possible scenario. Instead of following pre-programmed instructions, machine learning algorithms build mathematical models based on training data to make predictions or decisions.

### Key Characteristics of Machine Learning:
- **Data-driven**: Algorithms learn patterns from data
- **Adaptive**: Performance improves with more data
- **Automated**: Reduces need for manual programming
- **Predictive**: Can make predictions about unseen data

## Types of Machine Learning

Machine learning algorithms can be broadly categorized into three main types:

### 1. Supervised Learning

In supervised learning, algorithms learn from labeled training data. The algorithm learns to map inputs to correct outputs based on example input-output pairs.

**Common Applications:**
- Email spam detection
- Image classification
- Price prediction
- Medical diagnosis

**Popular Algorithms:**
- Linear Regression
- Decision Trees
- Random Forest
- Support Vector Machines (SVM)
- Neural Networks

**Example:**
Training a model to recognize handwritten digits by showing it thousands of images of digits along with their correct labels (0-9).

### 2. Unsupervised Learning

Unsupervised learning algorithms find hidden patterns in data without labeled examples. The algorithm must discover structure in the data on its own.

**Common Applications:**
- Customer segmentation
- Anomaly detection
- Data compression
- Recommendation systems

**Popular Algorithms:**
- K-Means Clustering
- Hierarchical Clustering
- Principal Component Analysis (PCA)
- Association Rules

**Example:**
Analyzing customer purchase patterns to group customers into segments without knowing beforehand what these segments should be.

### 3. Reinforcement Learning

Reinforcement learning algorithms learn through interaction with an environment, receiving rewards or penalties for their actions. The goal is to learn the optimal strategy to maximize cumulative reward.

**Common Applications:**
- Game playing (Chess, Go)
- Robotics
- Autonomous vehicles
- Trading algorithms

**Key Concepts:**
- Agent: The learner/decision maker
- Environment: The world the agent interacts with
- Actions: What the agent can do
- Rewards: Feedback from the environment
- Policy: The agent's strategy

**Example:**
Training an AI to play chess by letting it play millions of games and learning from wins and losses.

## The Machine Learning Workflow

### 1. Problem Definition
- Identify the business problem
- Determine if it's a classification, regression, or clustering problem
- Define success metrics

### 2. Data Collection and Preparation
- Gather relevant data
- Clean and preprocess the data
- Handle missing values
- Feature engineering

### 3. Model Selection and Training
- Choose appropriate algorithms
- Split data into training and testing sets
- Train models on training data
- Tune hyperparameters

### 4. Model Evaluation
- Test model performance on unseen data
- Use appropriate evaluation metrics
- Cross-validation
- Check for overfitting/underfitting

### 5. Deployment and Monitoring
- Deploy model to production
- Monitor model performance
- Retrain as needed

## Key Concepts and Terminology

### Overfitting and Underfitting
- **Overfitting**: Model learns training data too specifically, fails to generalize
- **Underfitting**: Model is too simple to capture underlying patterns
- **Good fit**: Model generalizes well to new data

### Bias-Variance Tradeoff
- **Bias**: Error from oversimplifying the model
- **Variance**: Error from sensitivity to small fluctuations in training data
- Goal is to minimize both bias and variance

### Feature Engineering
The process of selecting, modifying, or creating features (input variables) to improve model performance.

### Cross-Validation
A technique to assess how well a model will generalize to independent data by partitioning data into subsets.

## Getting Started with Machine Learning

### Prerequisites
- Basic statistics and probability
- Linear algebra fundamentals
- Programming skills (Python/R recommended)
- Understanding of data structures

### Popular Tools and Libraries
- **Python**: scikit-learn, TensorFlow, PyTorch, pandas, numpy
- **R**: caret, randomForest, e1071
- **Tools**: Jupyter Notebooks, Google Colab, Anaconda

### First Steps
1. Start with simple datasets (Iris, Titanic, Boston Housing)
2. Learn data manipulation with pandas
3. Try basic algorithms like linear regression and decision trees
4. Practice with online courses and tutorials
5. Work on personal projects

## Conclusion

Machine learning is a powerful tool that's transforming industries and creating new possibilities. While the field can seem overwhelming at first, starting with the basics and gradually building your understanding through hands-on practice is the best approach.

Remember that machine learning is as much about understanding your data and problem domain as it is about algorithms. Focus on solving real problems, and the technical skills will follow.

The field is rapidly evolving, so continuous learning and staying updated with new developments is essential for anyone serious about machine learning.'''
        }
    ])


def downgrade() -> None:
    # Удаляем все данные из таблицы articles_full_text
    op.execute("DELETE FROM articles_full_text")
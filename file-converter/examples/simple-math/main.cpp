#include <stdio.h>
#include <stdlib.h>

// Simple utility function to add two numbers
int add(int a, int b) {
    return a + b;
}

// Simple utility function to multiply two numbers
int multiply(int a, int b) {
    return a * b;
}

// Fibonacci function
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Main function - entry point
int main() {
    printf("Hello from WebAssembly!\n");
    
    int sum = add(10, 20);
    int product = multiply(5, 6);
    int fib = fibonacci(10);
    
    printf("10 + 20 = %d\n", sum);
    printf("5 × 6 = %d\n", product);
    printf("fibonacci(10) = %d\n", fib);
    
    return 0;
}

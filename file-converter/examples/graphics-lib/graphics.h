#ifndef GRAPHICS_H
#define GRAPHICS_H

typedef struct {
    float x;
    float y;
    float z;
} Vector3;

typedef struct {
    float x;
    float y;
    float z;
    float w;
} Vector4;

Vector3 add_vectors(Vector3 a, Vector3 b);
Vector3 scale_vector(Vector3 v, float scale);
float dot_product(Vector3 a, Vector3 b);
float vector_length(Vector3 v);

Vector3 normalize(Vector3 v);
Vector3 cross_product(Vector3 a, Vector3 b);

#endif // GRAPHICS_H

function rotate(modelMatrix, position, rotationY = 0, rotationX = 0, rotationZ = 0) {
    Mat4.identity(modelMatrix);
    Mat4.translate(modelMatrix, modelMatrix, position);
    if (rotationY) {
        Mat4.rotateY(modelMatrix, modelMatrix, rotationY);
    }
    if (rotationX) {
        Mat4.rotateX(modelMatrix, modelMatrix, rotationX);
    }
    if (rotationZ) {
        Mat4.rotateZ(modelMatrix, modelMatrix, rotationZ);
    }
}

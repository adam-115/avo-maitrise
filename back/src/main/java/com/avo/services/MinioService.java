package com.avo.services;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class MinioService {

    private final MinioClient minioClient;
    private final String bucketName;

    public MinioService(MinioClient minioClient, @Value("${minio.bucket.name}") String bucketName) {
        this.minioClient = minioClient;
        this.bucketName = bucketName;
        initBucket();
    }

    public void initBucket() {
        try {
            boolean isExist = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!isExist) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Bucket {} created successfully", bucketName);
            }
        } catch (Exception e) {
            log.error("Error initializing MinIO bucket", e);
        }
    }

    public String uploadFile(String originalFilename, InputStream inputStream, long size, String contentType) {
        try {
            // S'assurer que le bucket existe avant l'upload (au cas où MinIO aurait démarré après Spring Boot)
            initBucket();
            
            String objectName = UUID.randomUUID().toString() + "_" + originalFilename;
            
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            return objectName;
        } catch (Exception e) {
            log.error("Error uploading file to MinIO", e);
            throw new RuntimeException("Could not upload file", e);
        }
    }

    public String getPresignedUrl(String objectName) {
        try {
            // Extract the original filename from the objectName (UUID_filename)
            String filename = objectName;
            if (objectName.contains("_")) {
                filename = objectName.substring(objectName.indexOf("_") + 1);
            }
            
            java.util.Map<String, String> queryParams = new java.util.HashMap<>();
            queryParams.put("response-content-disposition", "attachment; filename=\"" + filename + "\"");
            
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(1, TimeUnit.HOURS)
                            .extraQueryParams(queryParams)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error generating presigned URL", e);
            return null;
        }
    }

    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error deleting file from MinIO", e);
        }
    }

    public InputStream getFileStream(String objectName) {
        try {
            return minioClient.getObject(
                    io.minio.GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error retrieving file stream from MinIO", e);
            return null;
        }
    }
}

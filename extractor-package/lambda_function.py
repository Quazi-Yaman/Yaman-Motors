import json
import boto3
import urllib.parse
import io
from datetime import datetime, timezone
from pypdf import PdfReader

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

TABLE_NAME = "MICB_VendorInvoices"
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):

    print("================================")
    print("MICB PDF Extractor Started")
    print("================================")

    try:
        record = event["Records"][0]

        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(
            record["s3"]["object"]["key"]
        )

        print("Bucket:", bucket)
        print("File:", key)

        # Read PDF from S3
        response = s3.get_object(
            Bucket=bucket,
            Key=key
        )

        pdf_bytes = response["Body"].read()

        print("PDF size:", len(pdf_bytes), "bytes")

        # Extract text from PDF
        reader = PdfReader(io.BytesIO(pdf_bytes))

        extracted_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

        print("========== EXTRACTED TEXT ==========")
        print(extracted_text)
        print("====================================")

        if not extracted_text.strip():

            print("No readable text found.")

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "message": "No readable text found in PDF."
                })
            }

        # Generate receipt ID
        counter = table.update_item(
            Key={
                "receiptId": "COUNTER"
            },
            UpdateExpression="ADD receiptNumber :one",
            ExpressionAttributeValues={
                ":one": 1
            },
            ReturnValues="UPDATED_NEW"
        )

        number = int(
            counter["Attributes"]["receiptNumber"]
        )

        receipt_id = f"VRECEIPT-{number:07d}"

        # Save extracted text
        item = {
            "receiptId": receipt_id,
            "status": "EXTRACTED",

            "sourceBucket": bucket,
            "sourceFile": key,

            "rawText": extracted_text,

            "createdAt": datetime.now(
                timezone.utc
            ).isoformat()
        }

        table.put_item(Item=item)

        print("Receipt ID:", receipt_id)
        print("Extracted data saved to DynamoDB")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "PDF extracted successfully",
                "receiptId": receipt_id
            })
        }

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }
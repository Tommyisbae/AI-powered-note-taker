import json
import csv
import argparse
import os

def convert_json_to_csv(input_path, output_path):
    """
    Converts a JSON file containing flashcard data to a CSV file.

    The JSON file should be an array of objects, with each object
    representing a flashcard and containing "question" and "answer" keys.

    The output CSV file will have two columns: "Front" and "Back".
    """
    try:
        with open(input_path, 'r', encoding='utf-8') as json_file:
            flashcards = json.load(json_file)

        with open(output_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(['Front', 'Back'])  # Header row

            for card in flashcards:
                writer.writerow([card.get('question', ''), card.get('answer', '')])

        print(f"Successfully converted {len(flashcards)} flashcards.")
        print(f"CSV file saved to: {os.path.abspath(output_path)}")

    except FileNotFoundError:
        print(f"Error: The file '{input_path}' was not found.")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from the file '{input_path}'.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Convert JSON notes from the Smart PDF Notetaker to a CSV file for flashcard apps.',
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        'input_file',
        help='The path to the input JSON file (e.g., "my_notes_flashcards.json").'
    )
    parser.add_argument(
        '-o', '--output',
        dest='output_file',
        help='The path for the output CSV file (e.g., "my_flashcards.csv").\nIf not provided, it defaults to the input file name with a .csv extension.'
    )

    args = parser.parse_args()

    if not args.output_file:
        base_name = os.path.splitext(args.input_file)[0]
        args.output_file = f"{base_name}.csv"

    convert_json_to_csv(args.input_file, args.output_file)

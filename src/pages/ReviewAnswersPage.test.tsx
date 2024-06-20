import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router-dom";
import { server } from "../mocks/server";
import { render, screen, waitFor } from "../utility/test-utils";
import { ReviewAnswersPage } from "./ReviewAnswersPage";

const fileContent = {
  id: "file-1",
  file_name: "File1.txt",
  content: "this is file content information annotated_text1 annotated_text2",
};

const answer1Annotations = [
  {
    file_name: "File-1.tx",
    text: "annotated_text1",
    start_index: 33,
    end_index: 49,
  },
  {
    file_name: "File-2.tx",
    text: "query_text",
    start_index: 0,
    end_index: 11,
    source_text: "query_text from query results",
  },
];

const answer2Annotations = [
  {
    file_name: "File-2.tx",
    text: "annotated_text1",
    start_index: 33,
    end_index: 49,
  },
  {
    file_name: "File-3.tx",
    text: "annotated_text2",
    start_index: 49,
    end_index: 64,
  },
];
const answer1 = {
  id: "question-1",
  file_name: "File-1.txt",
  query: "Question-1",
  answers: answer1Annotations,
  additional_text: "answer-1 additional text",
};

const answer2 = {
  id: "question-2",
  file_name: "File-1.txt",
  query: "Question-2",
  answers: answer2Annotations,
};

const qnaResponse = [answer1, answer2];

describe("Review Answers Page", () => {
  beforeEach(() => {
    server.use(
      http.get(`/user/documents/file-1`, () => {
        return HttpResponse.json(fileContent);
      })
    );
    server.use(
      http.get(`/user/qna/document/file-1`, () => {
        return HttpResponse.json({ qna: qnaResponse });
      })
    );
    server.use(
      http.post(`/user/qna/question-1`, () => {
        return HttpResponse.json("Submitted successfully");
      })
    );
  });

  it("Should render Review page with first question", async () => {
    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("page-loader")).not.toBeInTheDocument();
      expect(
        screen.getByText("this is file content information")
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "annotated_text1"
    );
  });

  it("Should render Review page with next and previous question onClick of next or previous", async () => {
    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("page-loader")).not.toBeInTheDocument();
      expect(
        screen.getByText("this is file content information")
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "annotated_text1"
    );

    const nextBtn = screen.getByTestId("nextBtn");
    const prevBtn = screen.getByTestId("prevBtn");
    const questionInp = screen.getByPlaceholderText("Enter your question");

    await userEvent.click(nextBtn);

    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "annotated_text1 annotated_text2"
    );
    expect(questionInp).toHaveValue("Question-2");

    await userEvent.click(prevBtn);

    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "annotated_text1"
    );
    expect(questionInp).toHaveValue("Question-1");
  });

  it("Should render Error information inside Annotation page", async () => {
    server.use(
      http.get(`/user/documents/file-1`, () => {
        return HttpResponse.json(
          {
            message: "File not found",
          },
          { status: 404 }
        );
      })
    );

    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("page-loader")).not.toBeInTheDocument();
      expect(screen.getByText("File not found")).toBeInTheDocument();
    });
  });

  it("should make an api call to update answer", async () => {
    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("this is file content information")
      ).toBeInTheDocument();
    });

    const questionField = screen.getByPlaceholderText("Enter your question");
    let additionalInfoField = screen.getByPlaceholderText(
      "Enter additional information"
    );

    await userEvent.type(questionField, "test-query");
    const updateButton = screen.getByRole("button", { name: "Update" });

    await userEvent.type(additionalInfoField, "answer");
    await userEvent.click(updateButton);

    additionalInfoField = screen.getByPlaceholderText(
      "Enter additional information"
    );

    expect(screen.getByText("Submitted successfully")).toBeInTheDocument();
  });

  it("should show update answer api error message", async () => {
    server.use(
      http.post("user/qna/question-1", () => {
        return HttpResponse.json(
          {
            message: "Invalid document id",
          },
          { status: 400 }
        );
      })
    );

    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("this is file content information")
      ).toBeInTheDocument();
    });

    const questionField = screen.getByPlaceholderText("Enter your question");
    let additionalInfoField = screen.getByPlaceholderText(
      "Enter additional information"
    );

    await userEvent.type(questionField, "test-query");

    const updateBtn = screen.getByRole("button", { name: "Update" });

    await userEvent.type(additionalInfoField, "answer");
    await userEvent.click(updateBtn);

    additionalInfoField = screen.getByPlaceholderText(
      "Enter additional information"
    );

    expect(screen.getByText("Invalid document id")).toBeInTheDocument();
  });

  it("should show the annotation summary with annotated text and update when user deletes the annotated text", async () => {
    render(
      <Routes>
        <Route path="/review/:documentId" element={<ReviewAnswersPage />} />
      </Routes>,
      { initialEntries: ["/review/file-1"] }
    );

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("this is file content information")
      ).toBeInTheDocument();
    });

    const questionField = screen.getByPlaceholderText("Enter your question");
    await userEvent.type(questionField, "test-query");

    const text1ToSelect = screen.getByText("annotated_text2");
    expect(text1ToSelect).toBeInTheDocument();

    // highlight 15 characters from beginning of text element
    await userEvent.pointer([
      { target: text1ToSelect, offset: 0, keys: "[MouseLeft>]" },
      { offset: 16 },
      { keys: "[/MouseLeft]" },
    ]);

    expect(screen.getByText("Annotation Summary")).toBeInTheDocument();
    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "annotated_text1 query_text annotated_text2"
    );

    const deleteAnnotationBtn = screen.getAllByTestId(
      "annotation-delete-button"
    )[0];
    await userEvent.click(deleteAnnotationBtn);
    expect(screen.getByTestId("annotation-text-answer")).toHaveTextContent(
      "query_text annotated_text2"
    );
  });
});
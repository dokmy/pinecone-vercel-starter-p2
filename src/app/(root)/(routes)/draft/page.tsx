"use client";

import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const api_key = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const DraftPage = () => {
  const [value, setValue] = useState("");
  const [text, setText] = useState("");
  const onEditorInputChange = (newValue: any, editor: any) => {
    setValue(newValue);
    setText(editor.getContent({ format: "text" }));
  };

  console.log("text: ", text);
  console.log("value: ", value);

  return (
    <div className="flex flex-row p-5">
      <div className="w-2/3">
        <Editor
          apiKey="ae6klqvwi8642sg1druqk0vdjn2rc5o8qweuctk8pd2tvdlx"
          onEditorChange={(newValue, editor) =>
            onEditorInputChange(newValue, editor)
          }
          onInit={(evt, editor) =>
            setText(editor.getContent({ format: "text" }))
          }
          value={value}
          init={{
            height: 600,
            skin: "oxide-dark",
            content_css: "dark",
            plugins:
              "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed linkchecker a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode editimage advtemplate ai mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss",
            toolbar:
              "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat",
            tinycomments_mode: "embedded",
            tinycomments_author: "Author name",
            mergetags_list: [
              { value: "First.Name", title: "First Name" },
              { value: "Email", title: "Email" },
            ],
            ai_request: (request: any, respondWith: any) => {
              respondWith.stream((signal: any, streamMessage: any) => {
                // Adds each previous query and response as individual messages
                const conversation = request.thread.flatMap((event: any) => {
                  if (event.response) {
                    return [
                      { role: "user", content: event.request.query },
                      { role: "assistant", content: event.response.data },
                    ];
                  } else {
                    return [];
                  }
                });

                // System messages provided by the plugin to format the output as HTML content.
                const pluginSystemMessages = request.system.map(
                  (content: any) => ({
                    role: "system",
                    content,
                  })
                );

                const systemMessages = [
                  ...pluginSystemMessages,
                  // Additional system messages to control the output of the AI
                  {
                    role: "system",
                    content:
                      "Remove lines with ``` from the response start and response end. Also removes the ``` from the start and end of each line in the response. Also remove ```html from the start of the response and ``` from the end of the response.",
                  },
                ];

                // Forms the new query sent to the API
                const content =
                  request.context.length === 0 || conversation.length > 0
                    ? request.query
                    : `Question: ${request.query} Context: """${request.context}"""`;

                const messages = [
                  ...conversation,
                  ...systemMessages,
                  { role: "user", content },
                ];

                const requestBody = {
                  model: "gpt-4-0125-preview",
                  temperature: 0.7,
                  max_tokens: 400,
                  messages,
                  stream: true,
                };

                const openAiOptions = {
                  signal,
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${api_key}`,
                  },
                  body: JSON.stringify(requestBody),
                };

                const onopen = async (response: any) => {
                  if (response) {
                    const contentType = response.headers.get("content-type");
                    if (
                      response.ok &&
                      contentType?.includes("text/event-stream")
                    ) {
                      return;
                    } else if (contentType?.includes("application/json")) {
                      const data = await response.json();
                      if (data.error) {
                        throw new Error(
                          `${data.error.type}: ${data.error.message}`
                        );
                      }
                    }
                  } else {
                    throw new Error(
                      "Failed to communicate with the ChatGPT API"
                    );
                  }
                };

                // This function passes each new message into the plugin via the `streamMessage` callback.
                const onmessage = (ev: any) => {
                  const data = ev.data;
                  if (data !== "[DONE]") {
                    const parsedData = JSON.parse(data);
                    const firstChoice = parsedData?.choices[0];
                    const message = firstChoice?.delta?.content;
                    if (message) {
                      streamMessage(message);
                    }
                  }
                };

                const onerror = (error: any) => {
                  // Stop operation and do not retry by the fetch-event-source
                  throw error;
                };

                // Use microsoft's fetch-event-source library to work around the 2000 character limit
                // of the browser `EventSource` API, which requires query strings
                return fetchEventSource(
                  "https://api.openai.com/v1/chat/completions",
                  {
                    ...openAiOptions,
                    openWhenHidden: true,
                    onopen,
                    onmessage,
                    onerror,
                  }
                )
                  .then(async (response) => {
                    if (response && !response.ok) {
                      const data = await response.json();
                      if (data.error) {
                        throw new Error(
                          `${data.error.type}: ${data.error.message}`
                        );
                      }
                    }
                  })
                  .catch(onerror);
              });
            },
          }}
          initialValue="Welcome to FastLegal!"
        />
      </div>
    </div>
  );
};

export default DraftPage;

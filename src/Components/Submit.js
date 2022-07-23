import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MonacoEditor from "./MonacoEditor";
import PreLoader from "./PreLoader";
import { userContext } from "./Home";
const Submit = ({ contests }) => {
  const navigate = useNavigate("");
  const [loader, setLoader] = useState(false);
  const { user } = useContext(userContext);
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState(0);
  const [language, setLanguage] = useState("c");
  const [error, setError] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (code.replace(/\s/g, "").length == 0) {
      setError(true);
    } else {
      setError(false);
    }
  }, [code]);
  const contest = contests.filter((a) => a?.id == id)[0];

  const getMark = (idx, time) => {
    if (time - contest.startTime - contest.duration >= 0) {
      return 0;
    }
    let total, deduce;
    if (idx == 0) {
      total = 500;
      deduce = 2;
    } else if (idx == 1) {
      total = 1000;
      deduce = 4;
    } else {
      total = 1500;
      deduce = 6;
    }
    const elapsedTime = parseInt((time - contest.startTime) / 60000);
    return Math.max(total - elapsedTime * deduce, (total * 30) / 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoader(true);

    let language_id = 49;
    if (language == "c++") {
      language_id = 54;
    } else if (language == "java") {
      language_id = 62;
    } else if (language == "python") {
      language_id = 71;
    }
    let selectedProblem = contest.problems[parseInt(problem)];
    const { sampleInput, testInputSet, sampleOutput, testOutputSet, title } =
      selectedProblem;
    const submissionTime = new Date().getTime();
    // console.log(selectedProblem, sampleOutput, testOutputSet);
    const info = {
      email: user?.email,
      handle: user?.displayName,
      submissionTime,
      mark: getMark(parseInt(problem), submissionTime),
      cpu_time_limit: parseFloat(selectedProblem.timeLimit),
      memory_limit: parseFloat(selectedProblem.memoryLimit) * 1024,
      cpu_extra_time: 0.5,
      source_code: code,
      language_id,
      language,
      title,
      problem: parseInt(problem),
      stdin: [sampleInput].concat(testInputSet),
      output: [sampleOutput].concat(testOutputSet),
    };
    fetch(`http://localhost:5000/contests/${id}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(info),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoader(false);

        if (data?.acknowledged) {
          navigate(`/contests/${id}/my`);
        }
      });
  };
  const { problems } = contest;

  return (
    <div className="py-4 flex flex-col justify-center bg-[dark]">
      <form onSubmit={handleSubmit}>
        <div class="flex w-full max-w-xs  gap-x-1 mx-auto my-2">
          <label class="label">
            <span class="label-text font-semibold">Select Problem</span>
          </label>
          <select
            class="select select-bordered"
            onChange={(e) => setProblem(e.target.value[0].charCodeAt(0) - 65)}
          >
            {problems?.map((problem, idx) => (
              <option selected={idx == 0}>
                {String.fromCharCode(idx + 65)}){problem?.title}
              </option>
            ))}
          </select>
        </div>
        <div class=" w-full max-w-xs  flex   gap-x-1 mx-auto my-2">
          <label class="label ">
            <span class="label-text font-semibold">Select Language</span>
          </label>
          <select
            class="select select-bordered"
            onChange={(e) => setLanguage(e.target.value.toLowerCase())}
          >
            <option selected>C</option>
            <option>C++</option>
            <option>Java</option>
            <option>Python</option>
          </select>
        </div>
        <div class="w-full max-w-xs mx-auto my-2">
          <label class="label align-self-start">
            <span class="label-text font-semibold">Source Code:</span>
          </label>

          <MonacoEditor
            setCode={setCode}
            language={language == "c++" ? "cpp" : language}
          ></MonacoEditor>
          {error && <p className="text-[red]">*code can't be empty</p>}
        </div>

        <PreLoader loading={loader}></PreLoader>

        <button
          type="submit"
          className="btn btn-sm block mx-auto mb-4 mt-1"
          disabled={error}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Submit;
